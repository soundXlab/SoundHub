# Разговор 26 августа 2026 (вечер)

## Что сделано

### 1. Полное чтение Ableton Reference Manual (42 главы)

Прочитан **весь** Ableton Reference Manual Version 12 (~500 страниц):

| Глава | Содержание |
|-------|------------|
| 1-2 | Welcome, First Steps (installation, authorization, settings) |
| 3 | **Live Concepts** — Control Bar, Browser, Clips, Tracks, Devices, Mixer, Routing |
| 4 | Working with the Browser (content, search, filters, tags, collections) |
| 5 | **Managing Files and Sets** — samples, MIDI files, Live Clips, Live Sets, Projects |
| 6 | Arrangement View (layout, navigation, transport, loop, editing) |
| 7 | Session View (clips, scenes, track status, recording) |
| 8 | **Clip View** — clip panels, loop, time signature, groove, scale, warp, MIDI notes |
| 9 | **Audio Clips, Tempo, and Warping** — warp modes (Beats/Tones/Texture/Re-Pitch/Complex/Complex Pro) |
| 10 | Editing MIDI (note editor, velocities, probabilities, folding, scales) |
| 11 | MIDI Tools (transformation, generative tools) |
| 12 | Editing MPE |
| 13 | Converting Audio to MIDI |
| 14 | Using Grooves (Groove Pool, extracting, committing) |
| 15 | Tuning Systems |
| 16 | **Launching Clips** — launch modes, quantization, Follow Actions (10 types) |
| 17 | **Routing and I/O** — inputs, outputs, monitoring, internal routing, resampling |
| 18 | **Mixing** — volume, pan, sends, solo, cueing, crossfader, track delays |
| 19-22 | Synchronization (Link, MIDI Clock, Tempo Follower) |
| 23 | **Working with Instruments and Effects** — device view, A/B comparison, presets |
| 24 | **Instrument, Drum and Effect Racks** — chains, zones (key/velocity/chain select), macro controls, Drum Rack pads |
| 25 | **Automation** — recording, editing breakpoints, shapes, locking |
| 26-27 | MIDI/Key Remote Control, Managing CPU |
| 28 | **Live Audio Effect Reference** — все 41 audio effect с параметрами |
| 29 | **Live MIDI Effect Reference** — все 8 MIDI effects |
| 30 | **Live Instrument Reference** — все 12 instruments |
| 31 | Max for Live |
| 32 | Working with Video |

### 2. Обновление ALP_SPEC.md

Обновлена `docs/ai/ALP_SPEC.md` до **1356 строк** (было ~700):

**Добавлено:**
- Полный каталог 41 Audio Effect с XML tags и ключевыми параметрами
- Полный каталог 8 MIDI Effects с описанием Scale Awareness
- Полный каталог 12 Instruments с архитектурой
- Сигнал на треке (Signal Flow) для всех типов треков
- Warp Modes (6 типов) с описанием
- Clip Launch Modes (4 типа)
- Follow Actions (10 типов, linked/unlinked)
- Routing и I/O (Input types, Tap points, Monitoring)
- Zones (Key/Velocity/Chain Select) для Racks
- Groove Pool параметры
- Live Clip (.alc) формат
- Analysis Files (.asd) содержимое
- MIDI Clip свойства (ноты, probability, velocity)
- Audio Clip свойства (warp, loop, fade, RAM mode)

**Коммит:** `2abbadb` — `docs: complete ALP spec from full Ableton Reference Manual (42 chapters)`

### 3. Текущее состояние проекта

**SoundHub deployed:** https://soundhub-xescefoxlq-uc.a.run.app/
**Revision:** soundhub-00035-dps
**Account:** buffy/buffy123

**Не закоммичено:** Нет (всё закоммичено)

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
