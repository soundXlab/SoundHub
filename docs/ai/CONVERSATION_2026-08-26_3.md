# Разговор 26 августа 2026 (ночь — Steinberg)

## Что сделано

### 1. Изучена документация Steinberg (VST 3 SDK + Cubase Help)

**Источники:**
- VST 3 Developer Portal (steinbergmedia.github.io/vst3_dev_portal)
- Cubase Pro 15.0 Reference Manual (steinberg.help)
- VST 3 SDK GitHub repository
- Steinberg Forums (обсуждения формата .cpr)

**Ключевые находки:**

#### Формат Cubase .cpr — бинарный (не XML!)
- **Не читается как текст** — proprietary binary format
- **Не может быть отредактирован вручную** — только через Cubase/Nuendo
- **Содержит GTree** — внутренняя структура данных
- **Ограничение:** формат не рассчитан на файлы >2GB
- **Workaround:** Track Archive (.xml) — XML формат для экспорта треков

#### VST 3 Plugin Architecture
- **Processor + Controller separation** — обработка и GUI разделены
- **Dynamic I/O** — multiple busses (включая side-chain)
- **Parameters** — иерархическая структура
- **Persistence** — getState/setState через IBStream
- **Sample-accurate automation**

#### VST 3 Bundle Structure
```
MyPlugin.vst3/
├── Contents/
│   ├── Resources/
│   │   ├── moduleinfo.json
│   │   ├── Snapshots/
│   │   ├── VST XMLs/
│   │   └── Documentation/
│   ├── MacOS/
│   ├── x86_64-win/
│   ├── arm64ec-win/
│   ├── x86_64-linux/
│   └── Info.plist
```

#### VST XML Format
- Назначение: маппинг параметров для remote control
- Hardware-specific mappings (Nuage, etc.)
- Человекочитаемый XML формат

### 2. Создана спецификация Cubase/Nuendo

**Файл:** `docs/ai/CUBASE_SPEC.md` (582 строки)

**Содержание:**
- Типы треков: Audio, MIDI, Instrument, Sampler, Group, FX, VCA, Folder, Marker, Signature, Arranger, Video
- Signal Flow для каждого типа трека
- VST 3 API Architecture (IProcessor, IEditController, etc.)
- VST 2 vs VST 3 comparison
- Insert/Send effects (16 inserts, 8 sends per channel)
- Channel Strip and EQ
- MixConsole concepts
- Automation (sample-accurate)
- Ограничения для SoundHub (binary format)
- Workaround: Track Archive (.xml) export
- Сравнение с Ableton Live (.alp)

### 3. Ключевой вывод

| Формат | Формат файла | Парсинг для SoundHub |
|--------|-------------|---------------------|
| Ableton .alp | XML (ZIP архив) | ✅ Полностью парсится |
| Cubase .cpr | Binary | ❌ Только метаданные |
| Cubase Track Archive | XML | ✅ Парсится (workaround) |
| VST 3 preset | Binary/XML | ⚠️ Частично |

**Рекомендация:** Фокус на Ableton .alp для анализа, Cubase только через Track Archive.

---

## Следующий шаг

Начать **парсинг ALP** на основе полной спецификации:

1. **Профилирование текущего парсера** — что уже извлекает, что пропускает
2. **C++ streaming ALP worker** — minizip + pugixml + OpenSSL
3. **Python обёртка** — subprocess с fallback на текущую реализацию
4. **Receipt-style UI** — дерево треков → устройств → плагинов

### Приоритеты для следующей сессии:
- Начать с профилирования текущего als_parser.py
- Определить какие XML теги уже парсятся
- Написать C++ worker для потокового парсинга
- Создать receipt-style UI компонент
