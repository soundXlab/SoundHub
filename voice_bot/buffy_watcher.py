#!/usr/bin/env python3
"""Buffy Telegram Bot — with persistent memory.

Polls chat_log.md for new USER messages and responds as Buffy.
Stores conversation history in SQLite for 7-day memory retention.

Features:
  - Persistent memory (SQLite, 7-day rolling window)
  - Conversation context sent to AI (last 20 messages)
  - Commands: /memory, /clear, /help
  - !command → shell execution
  - @buffy / Buffy → AI response with memory context
"""
import base64
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import requests

# Manual .env loading (no dotenv dependency)
def _load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key, val = key.strip(), val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val

_load_env()

TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
CHAT_LOG = os.path.join(os.path.dirname(__file__), "chat_log.md")
MEMORY_DB = os.path.join(os.path.dirname(__file__), "memory.db")
MEMORY_DAYS = int(os.getenv("MEMORY_DAYS", "7"))
CONTEXT_MESSAGES = int(os.getenv("CONTEXT_MESSAGES", "20"))
POLL_INTERVAL = 2

if not TOKEN or not CHAT_ID:
    print("ERROR: TELEGRAM_TOKEN or CHAT_ID not set in .env")
    sys.exit(1)


# ── Memory Database ────────────────────────────────────────────────────

def init_db():
    """Initialize SQLite database for conversation memory."""
    conn = sqlite3.connect(MEMORY_DB)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id TEXT NOT NULL,
            role TEXT NOT NULL,       -- 'user' or 'assistant'
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_messages_chat_ts
        ON messages(chat_id, timestamp DESC)
    """)
    conn.commit()
    return conn


def store_message(conn, role, content):
    """Store a message in the database."""
    conn.execute(
        "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)",
        (CHAT_ID, role, content),
    )
    conn.commit()


def get_context(conn, limit=None):
    """Get recent conversation history for context."""
    if limit is None:
        limit = CONTEXT_MESSAGES
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MEMORY_DAYS)).isoformat()
    rows = conn.execute(
        """SELECT role, content FROM messages
           WHERE chat_id = ? AND timestamp > ?
           ORDER BY timestamp DESC LIMIT ?""",
        (CHAT_ID, cutoff, limit),
    ).fetchall()
    rows.reverse()  # oldest first
    return [{"role": r, "content": c} for r, c in rows]


def get_memory_stats(conn):
    """Get memory statistics."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MEMORY_DAYS)).isoformat()
    total = conn.execute(
        "SELECT COUNT(*) FROM messages WHERE chat_id = ? AND timestamp > ?",
        (CHAT_ID, cutoff),
    ).fetchone()[0]
    oldest = conn.execute(
        "SELECT MIN(timestamp) FROM messages WHERE chat_id = ? AND timestamp > ?",
        (CHAT_ID, cutoff),
    ).fetchone()[0]
    return {"total_messages": total, "oldest": oldest, "days": MEMORY_DAYS}


def cleanup_old_memory(conn):
    """Remove messages older than MEMORY_DAYS."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MEMORY_DAYS)).isoformat()
    deleted = conn.execute(
        "DELETE FROM messages WHERE chat_id = ? AND timestamp <= ?",
        (CHAT_ID, cutoff),
    ).rowcount
    conn.commit()
    return deleted


# ── Telegram ───────────────────────────────────────────────────────────

def send_telegram(text):
    """Send a message to Telegram."""
    # Telegram has a 4096 char limit
    chunks = []
    while len(text) > 4096:
        # Find a good split point
        split_at = text.rfind("\n", 0, 4096)
        if split_at == -1:
            split_at = 4096
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    chunks.append(text)

    for chunk in chunks:
        r = requests.post(
            f"https://api.telegram.org/bot{TOKEN}/sendMessage",
            json={"chat_id": CHAT_ID, "text": chunk},
            timeout=10,
        )
        if not r.ok:
            print(f"Telegram send failed: {r.status_code} {r.text[:200]}")
            return False
    return True


# ── Chat Log ───────────────────────────────────────────────────────────

PENDING_FILE = os.path.join(os.path.dirname(__file__), "PENDING.md")


def log_response(text):
    ts = datetime.now().strftime("%H:%M")
    with open(CHAT_LOG, "a", encoding="utf-8") as f:
        f.write(f"\n**[{ts}] BUFFY:** {text}\n")


def write_pending(msg):
    ts = datetime.now().strftime("%H:%M")
    with open(PENDING_FILE, "a", encoding="utf-8") as f:
        f.write(f"\n**[{ts}]** {msg}\n")


# ── Shell Commands ─────────────────────────────────────────────────────

def run_command(cmd):
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=120,
            cwd="/home/scatter/SoundHub"
        )
        output = result.stdout.strip()
        if result.returncode != 0:
            error = result.stderr.strip()
            output = f"{output}\n{error}" if output else error
        return output or "(no output)"
    except subprocess.TimeoutExpired:
        return "⏰ Command timed out (120s)"
    except Exception as e:
        return f"❌ Error: {e}"


# ── AI Response ────────────────────────────────────────────────────────

# ── Project Context (CLAUDE.md + STATE.md) ──────────────────────────────

SOUNDHUB_ROOT = os.getenv("SOUNDHUB_ROOT", "/home/scatter/SoundHub")
CLAUDE_MD_PATH = os.path.join(SOUNDHUB_ROOT, "CLAUDE.md")
STATE_MD_PATH = os.path.join(SOUNDHUB_ROOT, "docs", "ai", "STATE.md")

_project_context_cache = {"text": "", "mtime": 0.0}
PROJECT_CONTEXT_RELOAD_SEC = 300  # re-read files every 5 min


def _read_file_safe(path: str) -> str:
    """Read a file and return its content, or empty string on error."""
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""


def load_project_context(force: bool = False) -> str:
    """Load CLAUDE.md + STATE.md, with caching.

    Returns a combined string to inject into the system prompt.
    Reloads automatically every PROJECT_CONTEXT_RELOAD_SEC seconds
    or when force=True.
    """
    import time
    now = time.time()
    if not force and _project_context_cache["text"] and (now - _project_context_cache["mtime"]) < PROJECT_CONTEXT_RELOAD_SEC:
        return _project_context_cache["text"]

    parts = []
    claude_md = _read_file_safe(CLAUDE_MD_PATH)
    if claude_md:
        parts.append(f"## Правила проекта (CLAUDE.md)\n\n{claude_md}")

    state_md = _read_file_safe(STATE_MD_PATH)
    if state_md:
        parts.append(f"## Текущее состояние проекта (STATE.md)\n\n{state_md}")

    text = "\n\n---\n\n".join(parts) if parts else ""
    _project_context_cache["text"] = text
    _project_context_cache["mtime"] = now
    return text


def build_system_prompt() -> str:
    """Build the full system prompt with project context."""
    base = f"""Ты — Buffy, AI-ассистент для разработки. Ты работаешь в проекте SoundHub.

Ключевые правила:
- Отвечай на русском языке, если пользователь пишет на русском
- Отвечай кратко и по существу
- Если есть контекст предыдущих сообщений — используй его
- Помнишь всё из разговора за последние {MEMORY_DAYS} дней
- Если пользователь просит что-то сделать — делай, а не просто объясняй
- Используй правила проекта и текущее состояние из разделов ниже

Команды:
- /memory — статистика памяти
- /clear — очистить историю
- /help — справка
- !команда — выполнить shell-команду
- /state — показать текущее состояние проекта (STATE.md)"""

    project_ctx = load_project_context()
    if project_ctx:
        base += f"\n\n---\n\n{project_ctx}"

    return base


def get_ai_reply(conn, user_message):
    """Get AI reply with conversation context from memory."""
    # Build context messages
    history = get_context(conn, limit=CONTEXT_MESSAGES)

    messages = []
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    try:
        model = os.getenv("MODEL", "nvidia_nim/meta/llama-3.3-70b-instruct")
        base_url = os.getenv("FCC_SERVER_URL", "http://localhost:8082")
        api_key = os.getenv("FCC_AUTH_TOKEN", "freecc")

        # Build system prompt with fresh project context
        system_prompt = build_system_prompt()

        payload = json.dumps({
            "model": model,
            "max_tokens": 1024,
            "system": system_prompt,
            "messages": messages,
        })

        result = subprocess.run(
            [
                "curl", "-s", "--max-time", "90",
                f"{base_url}/v1/messages",
                "-H", "Content-Type: application/json",
                "-H", f"x-api-key: {api_key}",
                "-H", "anthropic-version: 2023-06-01",
                "-d", payload,
            ],
            capture_output=True, text=True, timeout=100,
        )

        if result.returncode != 0:
            return f"Curl error: {result.stderr[:200]}"

        data = json.loads(result.stdout)
        parts = []
        for block in data.get("content", []):
            if block.get("type") == "text":
                parts.append(block["text"])
        return "\n".join(parts) if parts else "No response."

    except json.JSONDecodeError:
        return f"Invalid response: {result.stdout[:200]}"
    except subprocess.TimeoutExpired:
        return "⏰ AI timeout (90s)"
    except Exception as e:
        return f"❌ Error: {e}"


# ── Video Processing ─────────────────────────────────────────────────

def is_video_url(msg):
    """Check if a message contains a video URL."""
    url_pattern = re.compile(r'https?://\S+')
    urls = url_pattern.findall(msg)
    for url in urls:
        lower = url.lower()
        if any(ext in lower for ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']):
            return url
        if 'youtube.com' in lower or 'youtu.be' in lower:
            return url
        if 'tiktok.com' in lower or 'instagram.com' in lower:
            return url
    return None

def download_video(url, output_path="/tmp/video_input.mp4"):
    """Download a video from URL."""
    try:
        # Use yt-dlp for social media, curl for direct links
        if any(x in url for x in ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com']):
            result = subprocess.run(
                ['yt-dlp', '-f', 'best[height<=720]', '-o', output_path, url],
                capture_output=True, text=True, timeout=120
            )
        else:
            result = subprocess.run(
                ['curl', '-sL', '-o', output_path, '-m', '60', url],
                capture_output=True, text=True, timeout=70
            )
        if result.returncode != 0:
            return None, f"Download failed: {result.stderr[:200]}"
        if not os.path.exists(output_path) or os.path.getsize(output_path) < 1000:
            return None, "Downloaded file is too small or missing"
        return output_path, None
    except subprocess.TimeoutExpired:
        return None, "Download timed out"
    except Exception as e:
        return None, f"Download error: {e}"

def extract_frames(video_path, max_frames=6):
    """Extract key frames from video using ffmpeg."""
    frames_dir = "/tmp/video_frames"
    os.makedirs(frames_dir, exist_ok=True)
    # Clean old frames
    for f in os.listdir(frames_dir):
        os.remove(os.path.join(frames_dir, f))

    # Get video duration
    probe = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video_path],
        capture_output=True, text=True, timeout=10
    )
    duration = float(probe.stdout.strip() or '10')

    # Extract frames evenly spaced
    interval = max(duration / (max_frames + 1), 0.5)
    extracted = []
    for i in range(max_frames):
        ts = interval * (i + 1)
        frame_path = os.path.join(frames_dir, f"frame_{i:02d}.jpg")
        subprocess.run(
            ['ffmpeg', '-y', '-ss', str(ts), '-i', video_path,
             '-vframes', '1', '-q:v', '2', frame_path],
            capture_output=True, timeout=15
        )
        if os.path.exists(frame_path) and os.path.getsize(frame_path) > 100:
            extracted.append(frame_path)
    return extracted

def describe_frames(frame_paths):
    """Send frames to vision model and get description."""
    images_b64 = []
    for path in frame_paths:
        with open(path, 'rb') as f:
            images_b64.append(base64.b64encode(f.read()).decode())

    # Build message with images
    content = [{"type": "text", "text": "Опиши что происходит на этих кадрах из видео. Будь подробным но кратким. Опиши: действия, интерфейс, что показывается на экране. Отвечай на русском."}]
    for b64 in images_b64:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": b64,
            }
        })

    try:
        model = os.getenv("VISION_MODEL", "google/gemini-2.0-flash-exp:free")
        base_url = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1")
        api_key = os.getenv("OPENROUTER_KEY", "")

        payload = json.dumps({
            "model": model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": content}],
        })

        result = subprocess.run(
            ['curl', '-s', '--max-time', '60',
             f"{base_url}/chat/completions",
             '-H', 'Content-Type: application/json',
             '-H', f'Authorization: Bearer {api_key}',
             '-d', payload],
            capture_output=True, text=True, timeout=70,
        )

        data = json.loads(result.stdout)
        text = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        return text or "Не удалось описать кадры."
    except Exception as e:
        return f"Vision error: {e}"

def process_video(msg):
    """Process a video URL: download, extract frames, describe."""
    url = is_video_url(msg)
    if not url:
        return None

    send_telegram(f"📥 Скачиваю видео: {url[:80]}...")
    video_path, err = download_video(url)
    if err:
        return f"❌ Не удалось скачать видео: {err}"

    send_telegram("🎬 Извлекаю кадры...")
    frames = extract_frames(video_path)
    if not frames:
        return "❌ Не удалось извлечь кадры из видео"

    description = describe_frames(frames)

    # Cleanup
    for f in frames:
        os.remove(f)
    if os.path.exists(video_path):
        os.remove(video_path)

    return f"🎬 Видео ({len(frames)} кадров):\n\n{description}"


# ── Image Processing ─────────────────────────────────────────────────

def is_image_url(msg):
    """Check if a message contains an image URL."""
    url_pattern = re.compile(r'https?://\S+')
    urls = url_pattern.findall(msg)
    image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']
    image_hosts = ['imgur.com', 'i.redd.it', 'pbs.twimg.com', 'media.tenor.com',
                   'images.unsplash.com', 'firebasestorage.googleapis.com']
    for url in urls:
        lower = url.lower()
        # Direct image extension
        if any(ext in lower for ext in image_exts):
            return url
        # Known image hosts
        if any(host in lower for host in image_hosts):
            return url
        # Telegram document/photo URLs often have no extension
        if 'telegra.ph' in lower or 't.me' in lower:
            return url
    return None


def download_image(url, output_path="/tmp/image_input.jpg"):
    """Download an image from URL."""
    try:
        result = subprocess.run(
            ['curl', '-sL', '-o', output_path, '-m', '30',
             '-H', 'User-Agent: Mozilla/5.0', url],
            capture_output=True, text=True, timeout=40,
        )
        if result.returncode != 0:
            return None, f"Download failed: {result.stderr[:200]}"
        if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
            return None, "Downloaded file is too small or missing"
        return output_path, None
    except subprocess.TimeoutExpired:
        return None, "Download timed out"
    except Exception as e:
        return None, f"Download error: {e}"


def describe_image(image_path, question=None):
    """Send a single image to vision model and get description."""
    with open(image_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()

    # Detect media type from extension
    ext = os.path.splitext(image_path)[1].lower()
    media_type_map = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
    }
    media_type = media_type_map.get(ext, 'image/jpeg')

    prompt = question or (
        "Опиши что изображено на этой картинке. "
        "Будь подробным но кратким. "
        "Опиши: объекты, действия, интерфейс, текст, цвета. "
        "Отвечай на русском."
    )

    content = [
        {"type": "text", "text": prompt},
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": img_b64,
            },
        },
    ]

    try:
        model = os.getenv("VISION_MODEL", "google/gemini-2.0-flash-exp:free")
        base_url = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1")
        api_key = os.getenv("OPENROUTER_KEY", "")

        payload = json.dumps({
            "model": model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": content}],
        })

        result = subprocess.run(
            ['curl', '-s', '--max-time', '60',
             f"{base_url}/chat/completions",
             '-H', 'Content-Type: application/json',
             '-H', f'Authorization: Bearer {api_key}',
             '-d', payload],
            capture_output=True, text=True, timeout=70,
        )

        data = json.loads(result.stdout)
        text = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        return text or "Не удалось описать картинку."
    except Exception as e:
        return f"Vision error: {e}"


def process_image(msg):
    """Process an image URL: download, describe."""
    url = is_image_url(msg)
    if not url:
        return None

    send_telegram(f"🖼️ Скачиваю картинку: {url[:80]}...")
    image_path, err = download_image(url)
    if err:
        return f"❌ Не удалось скачать картинку: {err}"

    # Extract optional question from message (text after the URL)
    question = None
    url_match = re.search(r'https?://\S+', msg)
    if url_match:
        after_url = msg[url_match.end():].strip()
        if after_url:
            question = after_url

    description = describe_image(image_path, question)

    # Cleanup
    if os.path.exists(image_path):
        os.remove(image_path)

    return f"🖼️ Картинка:\n\n{description}"


def process_media(msg):
    """Process media URLs (video or image). Returns response or None."""
    if is_video_url(msg):
        return process_video(msg)
    if is_image_url(msg):
        return process_image(msg)
    return None


# ── Message Processing ─────────────────────────────────────────────────

def should_process(msg):
    lower = msg.lower()
    return (msg.startswith("!") or "@buffy" in lower or "buffy" in lower
            or is_video_url(msg) is not None or is_image_url(msg) is not None)


def strip_mention(msg):
    for pattern in ["@buffy", "@Buffy", "Buffy", "buffy"]:
        msg = msg.replace(pattern, "").strip()
    return msg


def find_last_unprocessed():
    if not os.path.exists(CHAT_LOG):
        return None
    with open(CHAT_LOG, encoding="utf-8") as f:
        lines = f.readlines()

    last_user = None
    last_user_idx = -1
    for i, line in enumerate(lines):
        if "USER" in line and ":**" in line and "BUFFY" not in line:
            parts = line.split(":** ", 1)
            if len(parts) > 1:
                last_user = parts[-1].strip()
                last_user_idx = i

    if last_user is None:
        return None

    for i in range(last_user_idx + 1, len(lines)):
        if "BUFFY" in lines[i] and ":**" in lines[i]:
            return None

    return last_user


def handle_command(conn, msg):
    """Handle special commands."""
    if msg == "/memory":
        stats = get_memory_stats(conn)
        oldest = stats["oldest"] or "нет данных"
        return (
            f"🧠 Память Buffy:\n"
            f"• Сообщений за {stats['days']} дней: {stats['total_messages']}\n"
            f"• Самое старое: {oldest}\n"
            f"• БД: {MEMORY_DB}"
        )

    if msg == "/clear":
        cutoff = (datetime.now(timezone.utc) - timedelta(days=MEMORY_DAYS)).isoformat()
        deleted = conn.execute(
            "DELETE FROM messages WHERE chat_id = ? AND timestamp > ?",
            (CHAT_ID, cutoff),
        ).rowcount
        conn.commit()
        return f"🗑️ Очищено {deleted} сообщений из памяти."

    if msg == "/help":
        return (
            "🤖 Buffy — AI-ассистент с памятью\n\n"
            "Помню всё за последние {days} дней.\n\n"
            "Команды:\n"
            "/memory — статистика памяти\n"
            "/clear — очистить историю\n"
            "/help — эта справка\n"
            "/state — текущее состояние проекта\n"
            "!ls — выполнить shell-команду\n"
            "@buffy вопрос — спросить меня\n"
        ).format(days=MEMORY_DAYS)

    if msg == "/state":
        state_md = _read_file_safe(STATE_MD_PATH)
        if state_md:
            # Truncate if too long for Telegram (4096 char limit)
            if len(state_md) > 3800:
                state_md = state_md[:3800] + "\n... (обрезано)"
            return f"📋 Текущее состояние проекта:\n\n{state_md}"
        return "⚠️ docs/ai/STATE.md не найден."

    return None


def process_message(conn, msg):
    """Process a user message and return the response."""
    # Handle /commands
    if msg.startswith("/"):
        reply = handle_command(conn, msg)
        if reply:
            return reply

    # Media URL processing (video or image)
    media_response = process_media(msg)
    if media_response:
        return media_response

    # Shell command
    if msg.startswith("!"):
        cmd = msg[1:].strip()
        output = run_command(cmd)
        # Truncate long output
        if len(output) > 2000:
            output = output[:2000] + "\n... (truncated)"
        return f"$ {cmd}\n\n{output}"

    # AI response with memory
    cleaned = strip_mention(msg)
    if cleaned:
        reply = get_ai_reply(conn, cleaned)
        if reply and not reply.startswith("Error:") and not reply.startswith("Curl error:"):
            return reply

    # Fallback
    write_pending(msg)
    send_telegram("⏳ Озадачен… (AI недоступен)")
    return None


# ── Main Loop ──────────────────────────────────────────────────────────

def main():
    conn = init_db()
    # Clean up old messages on startup
    deleted = cleanup_old_memory(conn)
    if deleted:
        print(f"🧹 Cleaned {deleted} old messages from memory")

    print(f"👀 Buffy watcher started. Watching {CHAT_LOG}")
    print(f"   Poll interval: {POLL_INTERVAL}s")
    print(f"   Chat ID: {CHAT_ID}")
    print(f"   Memory: {MEMORY_DAYS} days, {CONTEXT_MESSAGES} context messages")
    print(f"   DB: {MEMORY_DB}")
    print()

    # On startup: log the last unprocessed message as pending
    unprocessed = find_last_unprocessed()
    if unprocessed:
        print(f"📩 Found unprocessed: {unprocessed}")
        sys.stdout.flush()
        write_pending(unprocessed)
        send_telegram("⏳ Озадачен…")
        print(f"📋 Logged to PENDING.md")
        sys.stdout.flush()

    last_line_count = sum(1 for _ in open(CHAT_LOG, "rb")) if os.path.exists(CHAT_LOG) else 0
    last_processed = None

    while True:
        try:
            current_count = sum(1 for _ in open(CHAT_LOG, "rb")) if os.path.exists(CHAT_LOG) else 0
            if current_count > last_line_count:
                with open(CHAT_LOG, encoding="utf-8") as f:
                    lines = f.readlines()

                for line in lines[last_line_count:]:
                    if "USER" in line and ":**" in line and "BUFFY" not in line:
                        parts = line.split(":** ", 1)
                        if len(parts) < 2:
                            continue
                        msg = parts[-1].strip()
                        if msg == last_processed:
                            continue
                        last_processed = msg

                        if not should_process(msg):
                            print(f"⏭️ Skipping: {msg[:60]}")
                            sys.stdout.flush()
                            continue

                        print(f"📩 User: {msg}")
                        sys.stdout.flush()

                        # Store user message in memory
                        store_message(conn, "user", msg)

                        # Process
                        response = process_message(conn, msg)
                        if response:
                            # Store assistant response in memory
                            store_message(conn, "assistant", response)
                            log_response(response)
                            send_telegram(response)
                            print(f"✅ Buffy: {response[:120]}...")
                        sys.stdout.flush()

                last_line_count = current_count

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            conn.close()
            print("\n👋 Buffy watcher stopped.")
            break
        except Exception as e:
            print(f"Error: {e}")
            sys.stdout.flush()
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
