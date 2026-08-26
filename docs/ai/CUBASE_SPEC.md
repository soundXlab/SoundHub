# SoundHub — Cubase/Nuendo (.cpr/.npr) полная спецификация

> На основе: Steinberg Reference Manual v15, VST 3 SDK, Steinberg Help Documentation
> Дата анализа: 2026-08-26

---

## 1. ЧТО ТАКОЕ .cpr/.npr

**Cubase Project (.cpr)** и **Nuendo Project (.npr)** — это файлы проектов DAW от Steinberg.

### 1.1 Формат файла

**ВАЖНО:** Формат .cpr/.npr — **бинарный**, не XML!

- **Не читается как текст** — это proprietary бинарный формат
- **Не может быть редактирован вручную** — только через Cubase/Nuendo
- **Содержит:** все настройки проекта, треки, MIDI данные, ссылки на аудио файлы
- **Ограничение:** формат не рассчитан на файлы >2GB (проблема в Cubase 10-11)
- **GTree:** внутренняя структура данных для хранения дерева проекта

### 1.2 Структура проекта (на диске)

```
MyProject/                          ← Project Folder
│
├── MyProject.cpr                   ← Main project file (binary)
│
├── Audio/                          ← Audio files
│   ├── MyProject_01.wav           ← Recorded audio
│   ├── MyProject_02.wav
│   └── ...
│
├── MIDI/                           ← MIDI files
│   ├── MyProject.mid
│   └── ...
│
├── Edits/                          ← Edited audio files
│   ├── MyProject_01_01.wav        ← Processed/edited versions
│   └── ...
│
├── Features/                       ← Freeze files
│   ├── MyProject_vst_01.wav       ← Frozen instrument tracks
│   └── ...
│
├── Import/                         ← Imported files
│
├── Remix/                          ← Remix data
│
├── Transfers/                      ← Transfer data
│
├── Video/                          ← Video files
│
├── Presets/                        ← Track presets
│
├── VST3 Presets/                   ← VST3 plugin presets
│   ├── VST3Presets.xml            ← Preset registry
│   └── [preset files]
│
├── VST2 Presets/                   ← VST2 plugin presets
│
└── [Other project files]
```

### 1.3 Типы файлов

| Расширение | Тип | Описание |
|-----------|-----|----------|
| `.cpr` | Project | Cubase project (binary) |
| `.npr` | Project | Nuendo project (binary) |
| `.wav` | Audio | PCM audio (mono/stereo, до 32-bit float) |
| `.aif` / `.aiff` | Audio | Apple audio format |
| `.mp3` | Audio | Compressed lossy |
| `.flac` | Audio | Compressed lossless |
| `.mid` | MIDI | Standard MIDI file |
| `.vstpreset` | Preset | VST3 plugin preset |
| `.fxp` | Preset | VST2 plugin preset (fxProgram) |
| `.fxb` | Preset | VST2 plugin bank (fxBank) |
| `.xml` | Preset | Cubase track preset |

---

## 2. ТИПЫ ТРЕКОВ (Cubase/Nuendo)

### 2.1 Audio Track

- **Назначение:** Запись и воспроизведение аудио
- **Корреспондирует:** Audio Channel в MixConsole
- **Содержит:** Audio events, audio parts
- **Эффекты:** Insert effects (до 16), Send effects (до 8)
- **Особенности:** Can have any number of automation tracks

### 2.2 MIDI Track

- **Назначение:** Запись и воспроизведение MIDI данных
- **Корреспондирует:** MIDI Channel
- **Содержит:** MIDI parts
- **Эффекты:** MIDI effects
- **Особенности:** Can be routed to VST instruments

### 2.3 Instrument Track

- **Назначение:** Dedicated VST instrument track
- **Корреспондирует:** Instrument Channel
- **Содержит:** MIDI data + instrument
- **Эффекты:** Insert effects, Send effects
- **Особенности:** Combination of VST instrument + instrument channel + MIDI track

### 2.4 Sampler Track

- **Назначение:** Playback of audio samples via MIDI
- **Корреспондирует:** Sampler Channel
- **Содержит:** Audio sample data
- **Эффекты:** Insert effects, Send effects
- **Особенности:** MIDI-controlled sample playback

### 2.5 Group Channel Track

- **Назначение:** Submix of several audio channels
- **Корреспондирует:** Group Channel
- **Содержит:** No events (settings and automation only)
- **Эффекты:** Insert effects, Send effects
- **Особенности:** For bus processing, submixing

### 2.6 FX Channel Track

- **Назначение:** Send effects processing
- **Корреспондирует:** FX Channel
- **Содержит:** Effects chain
- **Эффекты:** Insert effects (effects chain)
- **Особенности:** Receives audio via sends from other tracks

### 2.7 Folder Track

- **Назначение:** Container for other tracks
- **Содержит:** Nested tracks
- **Особенности:** Can collapse/expand tracks, edit multiple tracks

### 2.8 VCA Track

- **Назначение:** VCA fader control
- **Содержит:** VCA automation
- **Особенности:** Controls multiple tracks via VCA grouping

### 2.9 Marker Track

- **Назначение:** Navigation markers
- **Содержит:** Marker positions
- **Особенности:** For navigation, arrangement structure

### 2.10 Signature Track

- **Назначение:** Time signature and tempo changes
- **Содержит:** Signature/tempo events
- **Особенности:** For tempo automation

### 2.11 Arranger Track

- **Назначение:** Arrangement sections
- **Содержит:** Arranger events
- **Особенности:** For song structure editing

### 2.12 Video Track

- **Назначение:** Video playback
- **Содержит:** Video events
- **Особенности:** For scoring to picture

---

## 3. СИГНАЛ НА ТРЕКЕ (Signal Flow)

### 3.1 Audio Track (по умолчанию)

```
Input → [Pre-Gain] → [Insert FX 1-16] → [Channel Strip] → [EQ] → [Fader] → [Sends 1-8] → [Pan] → [Output]
                                      ↑                                               ↑
                              (Insert Effects)                              (Send Effects → FX Channel)
```

### 3.2 Instrument Track

```
MIDI Input → [VST Instrument] → Audio Output → [Insert FX 1-16] → [Channel Strip] → [EQ] → [Fader] → [Sends 1-8] → [Pan] → [Output]
                              ↑
                    (Instrument generates audio from MIDI)
```

### 3.3 FX Channel Track

```
Send Input (from other tracks) → [Insert FX 1-16] → [Channel Strip] → [EQ] → [Fader] → [Output]
```

### 3.4 Group Channel Track

```
Input (from multiple tracks) → [Insert FX 1-16] → [Channel Strip] → [EQ] → [Fader] → [Output]
```

---

## 4. VST ПЛАГИНЫ

### 4.1 Форматы плагинов

| Формат | Расширение | Описание |
|--------|-----------|----------|
| VST 3 | `.vst3` | Рекомендуемый формат, bundle structure |
| VST 2 | `.dll`/`.so`/`.dylib` | Legacy, deprecated |
| AU | `.component` | macOS only |
| CLAP | `.clap` | Новый open-source формат |

### 4.2 VST 3 Bundle Structure

```
MyPlugin.vst3/
├── Contents/
│   ├── Resources/
│   │   ├── moduleinfo.json        ← Module info
│   │   ├── Snapshots/             ← UI screenshots
│   │   ├── VST XMLs/              ← Parameter mappings
│   │   └── Documentation/
│   ├── MacOS/
│   │   └── MyPlugin              ← macOS binary
│   ├── x86_64-win/
│   │   └── MyPlugin.vst3         ← Windows 64-bit
│   ├── arm64ec-win/
│   │   └── MyPlugin.vst3         ← Windows ARM64EC
│   ├── x86_64-linux/
│   │   └── MyPlugin.so           ← Linux 64-bit
│   ├── Info.plist                 ← macOS properties
│   └── PkgInfo                    ← Bundle type
├── desktop.ini                    ← Windows custom icon
└── Plugin.ico                     ← Windows icon
```

### 4.3 VST 3 API Architecture

**Основные интерфейсы:**

| Интерфейс | Назначение |
|-----------|-----------|
| `IPluginBase` | Базовый интерфейс (initialize/terminate) |
| `IAudioProcessor` | Аудио обработка (process method) |
| `IComponent` | Информация о плагине (busses, state) |
| `IEditController` | GUI и параметры |
| `IConnectionPoint` | Связь между processor и controller |
| `IMidiMapping` | MIDI mapping параметров |
| `IUnitInfo` | Структура плагина (units/presets) |

**Ключевые концепции:**

1. **Processor + Controller separation:** Обработка и GUI разделены
2. **Parameters:** Иерархическая структура параметров
3. **Busses:** Динамические I/O конфигурации (включая side-chain)
4. **Persistence:** Состояние хранится в project files через `getState`/`setState`
5. **Sample-accurate automation:** Точная автоматизация

### 4.4 VST XML Format

VST 3 плагины могут содержать XML файлы для mapping параметров:

```
VST XMLs/
└── MyPlugin/
    ├── Generic.xml               ← Generic parameter mapping
    └── Hardware Name.xml         ← Specific hardware mapping
```

**Назначение:**
- Маппинг параметров для remote control
- Hardware-specific mappings (Nuage, etc.)
- Человекочитаемый формат

### 4.5 VST 2 vs VST 3

| Характеристика | VST 2 | VST 3 |
|---------------|-------|-------|
| I/O | Fixed | Dynamic (multiple busses) |
| Side-chain | Limited | Full support |
| Parameter organization | Flat | Hierarchical (tree) |
| Presets | .fxp/.fxb | .vstpreset |
| Note Expression | No | Yes |
| 3D Audio | No | Yes |
| Silence Flag | No | Yes |
| Multiple plugins/library | Shell concept | Factory concept |

---

## 5. ЭФФЕКТЫ

### 5.1 Insert Effects

- **Количество:** До 16 на канал
- **Порядок:** Serial processing (left to right)
- **Назначение:** Изменение тональности/динамики (distortion, filters, compression)
- **Расположение:** В signal chain канала

### 5.2 Send Effects

- **Количество:** До 8 sends на канал
- **Назначение:** Общие эффекты для нескольких каналов (reverb, delay)
- **Расположение:** На FX Channel Tracks
- **Pre/Post Fader:** Настройка точки отбора сигнала

### 5.3 Channel Strip

- **Встроенная обработка:** Gate, Compressor, EQ, Saturation, Tube, Transient, Limiter
- **Порядок:** Определяется пользователем
- **Назначение:** Базовая обработка на каждом канале

### 5.4 EQ

- **Тип:** 4-band parametric EQ
- **Полосы:** Low, Low-Mid, High-Mid, High
- **Фильтры:** Low-cut, High-cut
- **Назначение:** Тональная коррекция

---

## 6. КЛЮЧЕВЫЕ КОНЦЕПЦИИ CUBASE/NUENDO

### 6.1 MixConsole

- **Назначение:** Микширование проекта
- **Аналог:** Ableton Live Mixer
- **Содержит:** Все каналы (Audio, MIDI, Group, FX, VCA, Master)
- **Функции:** Volume, Pan, Sends, Inserts, EQ, Channel Strip

### 6.2 Channel Settings Window

- **Назначение:** Настройки одного канала
- **Содержит:** Inserts, Sends, EQ, Channel Strip, Strip, Meter
- **Особенности:** Подробные настройки каждого канала

### 6.3 Inspector

- **Назначение:** Быстрые настройки трека
- **Содержит:** Inserts, Sends, EQ, MIDI settings
- **Расположение:** Слева от track list

### 6.4 Pool

- **Назначение:** Управление аудио файлами проекта
- **Содержит:** Все аудио файлы, используемые в проекте
- **Функции:** Search, replace, collect, export

### 6.5 Control Room

- **Назначение:** Расширенная маршрутизация
- **Содержит:** Multiple monitor mixes, talkback, cues
- **Назначение:** Professional mixing environments

### 6.6 VST Connect

- **Назначение:** Remote recording
- **Особенности:** Запись через интернет

### 6.7 VST Sound

- **Назначение:** Библиотеки звуков
- **Формат:** `.vstsound` файлы
- **Управление:** Steinberg Library Manager

---

## 7. MIDI В CUBASE

### 7.1 MIDI Parts

- **Назначение:** Контейнер для MIDI данных
- **Содержит:** MIDI events (notes, CC, etc.)
- **Редактирование:** Key Editor (Piano Roll), Drum Editor, List Editor

### 7.2 MIDI Effects

- **Назначение:** Обработка MIDI перед инструментом
- **Типы:** Arpeggiator, Chord, Quantize, etc.
- **Расположение:** На MIDI/Instrument track

### 7.3 MIDI Remote Control

- **Назначение:** Управление параметрами
- **Протоколы:** MIDI CC, Mackie Control, HUI
- **Настройки:** VST Plug-in Manager

---

## 8. АВТОМАТИЗАЦИЯ

### 8.1 Automation Tracks

- **Назначение:** Автоматизация параметров
- **Типы:** Volume, Pan, Mute, Send Level, Insert parameters, etc.
- **Редактирование:** Line, Draw, Sample modes
- **Точность:** Sample-accurate (VST 3)

### 8.2 Automation Lanes

- **Назначение:** Несколько параметров на одном треке
- **Отображение:** Волновые графики
- **Редактирование:** Breakpoints, curves

---

## 9. ЧТО ИЗВЛЕКАЕМ ДЛЯ UI

### 9.1 Приоритет 1: Receipt-View (обзор проекта)

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **Project Name** | Имя .cpr файла | Заголовок |
| **Cubase Version** | Версия файла | "Cubase Pro 15" |
| **Total Tracks** | Количество треков | "24 tracks" |
| **Total Audio Files** | Количество аудио файлов | "156 audio files" |
| **Total MIDI Parts** | Количество MIDI частей | "89 MIDI parts" |
| **Sample Rate** | Настройки проекта | "48000 Hz" |
| **Bit Depth** | Настройки проекта | "32-bit float" |
| **Tempo** | Tempo track | "120 BPM" |
| **Time Signature** | Signature track | "4/4" |

### 9.2 Приоритет 2: Track List

Для каждого трека:

| Что | UI |
|-----|-----|
| **Name** | Название трека |
| **Type** | Audio/MIDI/Instrument/Group/FX |
| **Color** | Цвет трека |
| **Volume** | "0.0 dB" |
| **Pan** | "C" / "L15" / "R30" |
| **Mute/Solo** | 🔇/🔊 |
| **Insert Effects** | Список эффектов |
| **Send Effects** | Список sends |
| **Instrument** | VST Instrument name |

### 9.3 Приоритет 3: VST Plugins

| Что | UI |
|-----|-----|
| **Plugin Name** | Название плагина |
| **Plugin Type** | VST2/VST3/AU/CLAP |
| **Is Built-in** | ✅/⚠️ |
| **Instances** | Количество использований |
| **Parameters** | Ключевые параметры |

**Known Steinberg Built-in VST Instruments:**
- HALion Sonic
- Groove Agent SE
- Retrologue
- Padshop
- Iconica Sketch
- Verve

**Known Steinberg Built-in VST Effects:**
- StudioEQ
- Compressor
- Gate
- Limiter
- Maximizer
- StudioDelay
- RoomWorks
-程Reverb
- MultibandCompressor
- Quadrafuzz
- DaTube
- Frequency (EQ)

### 9.4 Приоритет 4: Audio Files

| Что | UI |
|-----|-----|
| **File Path** | "Audio/MyProject_01.wav" |
| **Format** | "WAV" / "AIFF" |
| **Sample Rate** | "48000 Hz" |
| **Bit Depth** | "32-bit float" |
| **Duration** | "3:42" |
| **File Size** | "12.5 MB" |

### 9.5 Приоритет 5: Routing

| Что | UI |
|-----|-----|
| **Input Routing** | "Ext. In 1/2" |
| **Output Routing** | "Stereo Out" / "Group 1" |
| **Sends** | "FX Channel 1 (Reverb)" |
| **Inserts** | "Compressor → EQ → Limiter" |

---

## 10. СРАВНЕНИЕ С ABLETON LIVE

| Характеристика | Cubase/Nuendo | Ableton Live |
|---------------|---------------|--------------|
| **Project Format** | .cpr/.npr (binary) | .als (XML) |
| **Pack Format** | .vstsound | .alp (ZIP) |
| **Track Types** | Audio, MIDI, Instrument, Group, FX, VCA, Folder, Marker, Signature, Arranger, Video, Sampler | Audio, MIDI, Group, Return, Master |
| **Effects Chain** | Inserts (16) + Sends (8) + Channel Strip + EQ | Device chain (serial) |
| **Routing** | Complex (busses, groups, VCA) | Simpler (sends, returns) |
| **MIDI Effects** | Built-in + VST | Built-in (Arpeggiator, Chord, etc.) |
| **VST Support** | VST 2 + VST 3 | VST 2 + VST 3 + AU |
| **Automation** | Sample-accurate | Breakpoint envelopes |
| **Mixing** | MixConsole (professional) | Mixer (simpler) |
| **Notation** | Score Editor | No built-in |
| **Video** | Video track | Basic video support |
| **Scoring** | Full notation | No built-in |

---

## 11. ОГРАНИЧЕНИЯ ДЛЯ SOUNDHUB

### 11.1 Что мы НЕ можем извлечь из .cpr

- ❌ **Детали треков** — формат бинарный, не парсится
- ❌ **MIDI ноты** — хранятся в бинарном формате
- ❌ **Automation data** — бинарный формат
- ❌ **Plugin parameters** — бинарный формат
- ❌ **Audio waveform** — нужен отдельный парсинг

### 11.2 Что мы МОЖЕМ извлечь

- ✅ **Project metadata** — имя, версия, настройки
- ✅ **File references** — ссылки на аудио/MIDI файлы
- ✅ **Folder structure** — структура проекта
- ✅ **Plugin list** — список использованных плагинов (из XML preset файлов)
- ✅ **Audio file metadata** — sample rate, bit depth, duration
- ✅ **Track archive** — если экспортирован в .xml

### 11.3 Workaround: Track Archive

Cubase может экспортировать **Track Archive** (.xml) — это XML файл содержащий:
- Track settings
- Plugin chains
- MIDI data
- Automation

**Для SoundHub:** Пользователь может экспортировать Track Archive для анализа.

---

## 12. URL-формат для SoundHub

```
/p/{username}                       — Portfolio
/projects/{id}                      — Project view (receipt-style)
/projects/{id}#tracks               — Track list
/projects/{id}#plugins             — Plugin registry
/projects/{id}#audio               — Audio files catalog
/projects/{id}#routing             — Routing diagram
```

---

## 13. РЕКОМЕНДАЦИИ

### 13.1 Для пользователей Cubase/Nuendo

1. **Экспортируйте Track Archive** (.xml) для анализа в SoundHub
2. **Собирайте проекты** в стандартную структуру папок
3. **Используйте VST 3** плагины (лучше поддержка)

### 13.2 Для разработки SoundHub

1. **Фокус на Metadata** — проект .cpr бинарный, парсинг ограничен
2. **Используйте Track Archive** — XML формат для анализа
3. **Поддерживайте VST 3** — современный стандарт
4. **Извлекайте Audio metadata** — WAV/AIFF заголовки

### 13.3 Сравнение с Ableton

| Что | Ableton (.alp) | Cubase (.cpr) |
|-----|----------------|---------------|
| Формат | XML (парсится) | Binary (не парсится) |
| Pack | ZIP архив | Project folder |
| Track data | Полностью в XML | В бинарном формате |
| Plugin state | XML | Binary |
| MIDI notes | XML | Binary |
| Automation | XML | Binary |

**Вывод:** Ableton .alp значительно лучше подходит для анализа, чем Cubase .cpr.
