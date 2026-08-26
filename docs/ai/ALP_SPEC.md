# SoundHub — Ableton Live Pack (.alp) спецификация

## Что такое .alp

.alp — это **Ableton Live Pack**, ZIP-архив содержащий полный Ableton Live проект:
- **Live Set** (.als) — gzip-compressed XML описания проекта
- **Audio Samples** (.wav, .aiff, .flac, .mp3) — сэмплы, лупы, пресеты
- **Presets** (.adv, .adg, .alc, .xpl) — пресеты инструментов и эффектов
- **Max for Live devices** (.amxd) — Max/MSP патчи
- **MIDI Files** (.mid) — MIDI-данные
- **Waveform/PNG thumbnails** — превью для UI

## Структура .als XML (что парсим)

### Уровень 1: Live Set
```xml
<LiveSet MajorVersion="12" MinorVersion="0">
  <Tempo><Manual Value="128.0"/></Tempo>
  <TimeSignature><Numerator Value="4"/><Denominator Value="4"/></TimeSignature>
  <Tracks>...</Tracks>
  <MasterTrack>...</MasterTrack>
</LiveSet>
```

### Уровень 2: Tracks
Типы треков в Ableton:
| XML Tag | Тип | Описание |
|---------|-----|----------|
| `AudioTrack` | audio | Аудио-дорожка (сэмплы, запись) |
| `MidiTrack` | midi | MIDI-дорожка (инструменты, ноты) |
| `GroupTrack` | group | Групповая дорожка (подмена) |
| `ReturnTrack` | return | Return-дорожка (общие эффекты) |
| `MasterTrack` | master | Master--output |

### Уровень 3: Devices (цепочка устройств на треке)
```
MIDI Track:
  [MIDI Effect] → [MIDI Effect] → [Instrument] → [Audio Effect] → [Audio Effect]

Audio Track:
  [Audio Effect] → [Audio Effect] → [Audio Effect]

Return Track:
  [Audio Effect] → [Audio Effect]
```

### Уровень 4: Plug-Ins
Типы плагинов в XML:
| XML Tag | Тип | Описание |
|---------|-----|----------|
| `VstPluginInfo` | VST2 | Классический VST |
| `VstPluginInfo` (VST3) | VST3 | Новый VST3 формат |
| `AudioUnitPluginInfo` | AU | Audio Unit (macOS) |
| `ClapPluginInfo` | CLAP | Новый CLAP формат |

Данные плагина в XML:
```xml
<PluginDevice>
  <VstPluginInfo>
    <PlugName Value="Serum"/>
    <PlugUniqueID Value="1769238114"/>
    <State>... (сериализованное состояние плагина) ...</State>
  </VstPluginInfo>
</PluginDevice>
```

### Уровень 5: Racks (Инструменты/Эффекты)
```xml
<InstrumentBranch> <!-- Instrument Rack -->
  <Branches>
    <InstrumentBranch>
      <BranchName Value="Drum Rack"/>
      <BranchDevices>
        <MidiToAudioDevice>
          <DrumGroupDevice>
            <DrumPads>
              <DrumPad>
                <SampleRef>...</SampleRef>
              </DrumPad>
            </DrumPads>
          </DrumGroupDevice>
        </MidiToAudioDevice>
      </BranchDevices>
    </InstrumentBranch>
  </Branches>
</InstrumentBranch>
```

## Что SoundHub должен ИЗВЛЕКАТЬ

### Приоритет 1: Метаданные для UI (receipt-style просмотр)

| Поле | Источник в XML | Зачем нужно |
|------|---------------|-------------|
| **Project Name** | имя .als файла | Заголовок в UI |
| **BPM** | `LiveSet/Tempo/Manual/@Value` | Отображение темпа |
| **Time Signature** | `LiveSet/TimeSignature/Numerator/Denominator` | Отображение размера |
| **Live Version** | `LiveSet/@MajorVersion.@MinorVersion` | Совместимость |
| **Track Count** | `len(Tracks)` | Общая статистика |

### Приоритет 2: Треки и их устройства

| Поле | Источник | UI |
|------|----------|-----|
| **Track Name** | `EffectiveName` или `Name` | Название дорожки |
| **Track Type** | XML tag name (Audio/Midi/Group/Return) | Иконка типа |
| **Track Color** | `Color` (integer → hex) | Цветовая полоска |
| **Track Height** | `TrackHeight` | Визуальный размер |
| **Mute/Solo/Arm** | `Mute`/`IsSoloExclusive`/`Arm` | Статус |
| **Volume** | `Volume/Manual/@Value` | Level meter |
| **Pan** | `Pan/Manual/@Value` | Панорама |
| **Sends** | `Sends` → `SendEffectChain` | Return-миксы |

### Приоритет 3: Устройства (Devices) на каждом треке

| Поле | Источник | UI |
|------|----------|-----|
| **Device Name** | XML tag (EQ Eight, Compressor, etc.) | Название |
| **Device Type** | category (builtin/VST/AU/CLAP) | Иконка |
| **Device Enabled** | `IsEnabled` | On/Off |
| **Plugin Name** | `PlugName` для VST/AU | Название плагина |
| **Plugin Version** | `State` metadata | Версия |
| **Plugin State** | `State` (сериализованное) | Для ре-активации |

### Приоритет 4: Сэмплы и аудио-файлы

| Поле | Источник | UI |
|------|----------|-----|
| **Sample Path** | `SampleRef/RelativePathElement` | Путь к файлу |
| **Sample Rate** | `.asd` analysis file или метаданные WAV | Качество |
| **Bit Depth** | WAV header | Качество |
| **Duration** | WAV/AIFF header | Длина |
| **Channels** | WAV header | Mono/Stereo |
| **Warp Mode** | `WarpMode` в clip | Способ растяжки |
| **Loop Settings** | `LoopStart/LoopEnd/LoopOn` | Зацикливание |
| **Clip Gain** | `Gain` в clip | Громкость |
| **Clip Transpose** | `Transpose` в clip | Транспозиция |

### Приоритет 5: MIDI-клипы

| Поле | Источник | UI |
|------|----------|-----|
| **MIDI Notes** | `MidiClip/Notes/Data` | Ноты (для отображения) |
| **Velocity** | `Note/@Velocity` | Динамика |
| **Quantization** | `Quantization` | Квантование |
| **Scale** | `Scale/RootNote/ScaleId` | Тональность |
| **Groove** | `Groove/` | Грув |

### Приоритет 6: Пресеты и Racks

| Поле | Источник | UI |
|------|----------|-----|
| **Rack Name** | `BranchName` | Название рэка |
| **Chain Count** | `len(Branches)` | Количество цепочек |
| **Macro Controls** | `MacroControls` | Макро-параметры |
| **Preset Files** | `.adv/.adg/.xpl` в архиве | Файлы пресетов |

## Что SoundHub должен ОТОБРАЖАТЬ в UI

### Receipt-Style Project View

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 TheForgebyHecq - Ableton Live Pack v9.1                    │
│  BPM: 128 | 4/4 | 12 tracks | 247 samples | 34 presets        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎵 Kick             [#FF6F61]                                  │
│    ├─ Drum Rack → EQ Eight → Compressor → Utility               │
│    └─ 3 samples (Kick_01.wav, Kick_02.wav, Kick_Noise.wav)     │
│                                                                 │
│  🎵 Bass             [#6ECFF6]                                  │
│    ├─ Serum (VST3) → SSL Comp → ValhallaRoom                   │
│    └─ MIDI clip: 8 bars, C minor                               │
│                                                                 │
│  🎵 Lead             [#A8E6CF]                                  │
│    ├─ Operator → Auto Filter → Chorus → Reverb                  │
│    └─ MIDI clip: 16 bars, Am scale                             │
│                                                                 │
│  🎵 Pads             [#FFD93D]                                  │
│    ├─ Wavetable → Echo → Hybrid Reverb                         │
│    └─ Audio clip: 32 bars, warped, 128 BPM                     │
│                                                                 │
│  ... (8 more tracks)                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📊 Summary                                                     │
│  ├─ Instruments: Drum Rack, Serum, Operator, Wavetable          │
│  ├─ Effects: EQ Eight, Compressor, Reverb, Delay, Chorus (×8)  │
│  ├─ VST Plugins: Serum (x2), FabFilter Pro-Q, ValhallaRoom    │
│  ├─ Audio: 247 files (1.2GB total)                             │
│  └─ MIDI Clips: 8                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Registry View

```
┌─────────────────────────────────────────────────────────────┐
│  🔌 Required Plugins                                        │
├─────────────────────────────────────────────────────────────┤
│  ✅ Built-in (Live 12)                                      │
│    EQ Eight, Compressor, Reverb, Chorus, Delay, Utility...  │
│                                                             │
│  ⚠️ Third-party VST/AU                                      │
│    Serum (VST3) — by Xfer Records                           │
│    FabFilter Pro-Q 3 — by FabFilter                         │
│    ValhallaRoom — by Valhalla DSP                           │
│                                                             │
│  ❓ Unknown                                                  │
│    (plugins that SoundHub can't identify)                   │
└─────────────────────────────────────────────────────────────┘
```

## Что НЕ нужно парсить (избыточно для маркетплейса)

| Что | Почему не нужно |
|-----|----------------|
| Automation breakpoints | Визуальная деталь, не критична для просмотра |
| Warp markers | Внутренняя настройка, не видна в overview |
| Clip envelopes | Детали модуляции, не для receipt-view |
| MIDI Map assignments | Привязка к контроллерам, не для просмотра |
| Groove pool | Нюансы квантования, не для overview |
| Return track routing | Техническая деталь |
| Video tracks | Rare, не для звукового маркетплейса |

## Текущий статус парсера

### Что уже извлекаем (als_parser.py + alp_parser.py)
- ✅ BPM
- ✅ Time Signature
- ✅ Track names и типы
- ✅ Device names (базовые)
- ✅ Plugin names (VST/AU)
- ✅ Sample references
- ✅ Preset references
- ✅ Archive contents (counts)

### Чего НЕ хватает (нужно добавить)
- ❌ Track color (integer → hex conversion)
- ❌ Track mute/solo/arm status
- ❌ Volume/pan values
- ❌ Device chain order (порядок устройств)
- ❌ Device enabled/disabled status
- ❌ Plugin type classification (builtin vs VST vs AU)
- ❌ Rack/chain structure (Drum Rack pads, Instrument Rack chains)
- ❌ Sample metadata (sample rate, bit depth, duration)
- ❌ MIDI clip content (ноты, velocity)
- ❌ Audio clip properties (warp mode, loop settings)
- ❌ Macro controls on racks
- ❌ Preset file extraction (.adv/.adg/.xpl)
- ❌ Streaming parsing (текущий подход загружает всё в память)

## Архитектура потокового C++ Worker

```
Input: ALP blob (any size, streaming from GCS)
  │
  ├─ ZIP stream reader (minizip)
  │   │
  │   ├─ For each entry:
  │   │   ├─ .als → decompress gzip → parse XML (pugixml)
  │   │   │   └─ Extract: tracks, devices, plugins, samples, metadata
  │   │   │
  │   │   ├─ .adv/.adg/.xpl → parse preset metadata
  │   │   │
  │   │   ├─ .wav/.aiff → read header (sample rate, bit depth, duration)
  │   │   │              → incremental SHA-256 (EVP)
  │   │   │
  │   │   └─ other → skip (or catalog)
  │   │
  │   └─ Output: JSON with full project metadata
  │
  └─ Output to stdout → Python reads → StorageObject.metadata_json
```

## URL-формат для SoundHub

```
/p/{username}                    — Portfolio (список проектов)
/projects/{id}                   — Project view (receipt-style)
/projects/{id}#track-{name}      — Jump to specific track
/projects/{id}#plugins           — Plugin registry
```

## Итого: Minimum Viable ALP Support

Для MVP нужно:

1. **Полный парсинг XML** — все треки, устройства, плагины, сэмплы
2. **Классификация плагинов** — builtin vs VST3 vs AU vs CLAP
3. **Receipt-style UI** — дерево треков → устройств → плагинов
4. **Plugin registry** — список требуемых сторонних плагинов
5. **Sample catalog** — список сэмплов с метаданными
6. **Streaming обработка** — для multi-GB ALP файлов

Для v2:
- Waveform для сэмплов
- MIDI clip preview (ноты в Piano Roll)
- Loudness analysis
- Sound similarity tags
