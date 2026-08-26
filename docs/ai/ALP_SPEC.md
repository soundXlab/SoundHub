# SoundHub — Ableton Live Pack (.alp) полная спецификация

> На основе: Ableton Reference Manual Version 12 (42 главы, ~500 страниц)
> Дата анализа: 2026-08-26

---

## 1. ЧТО ТАКОЕ .alp

.alp — **Ableton Live Pack**, ZIP-архив содержащий полный Ableton Live проект.

### 1.1 Файловая структура архива

```
PackName.alp (ZIP)
│
├── PackName.als                    ← ГЛАВНЫЙ Live Set (gzip-compressed XML)
│   └── LiveSet/
│       ├── Tempo                   ← BPM
│       ├── TimeSignature           ← Размер
│       ├── Tracks[]                ← Все дорожки
│       │   ├── AudioTrack          ← Аудио-дорожки
│       │   ├── MidiTrack           ← MIDI-дорожки
│       │   ├── GroupTrack          ← Групповые дорожки
│       │   ├── ReturnTrack         ← Return-дорожки
│       │   └── MasterTrack         ← Master output
│       ├── GroovePool              ← Грувы
│       └── GlobalSnapshots         ← Снимки
│
├── Freezey Songs/                  ← Замороженные треки (необязательно)
├── Samples/                        ← Аудио-сэмплы
│   ├── Import/                     ← Импортированные сэмплы
│   └── Processed/                  ← Обработанные сэмплы
│       ├── Reversed/               ← Реверсированные
│       ├── Frozen/                 ← Замороженные
│       └── Flattened/              ← Сведённые
├── Samples/Presets/                ← Пресеты инструментов
├── Presets/                        ← Резервные копии пресетов
│   ├── Instrument/
│   ├── Drum/
│   ├── Audio Effect/
│   ├── MIDI Effect/
│   └── Max/
├── Contact/                        ← Контактные данные
└── [Other project files]
```

### 1.2 Типы файлов внутри архива

| Расширение | Тип | Описание |
|-----------|-----|----------|
| `.als` | Live Set | Описание проекта (gzip XML) |
| `.wav` | Аудио | PCM аудио (mono/stereo, до 32-bit float) |
| `.aiff` / `.aif` | Аудио | Apple аудио формат |
| `.flac` | Аудио | Сжатый lossless |
| `.mp3` | Аудио | Сжатый lossy (CBR 320 kbps) |
| `.ogg` | Аудио | Ogg Vorbis |
| `.aac` | Аудио | Advanced Audio Coding |
| `.adv` | Preset | Ableton Device Preset (инструмент/эффект) |
| `.adg` | Preset | Ableton Device Group (Rack пресет) |
| `.alc` | Live Clip | Ableton Live Clip (с привязкой к сэмплу) |
| `.xpl` | Preset | Max for Live Preset |
| `.amxd` | Max Device | Max for Live патч |
| `.mid` | MIDI | Standard MIDI файл |
| `.asd` | Analysis | Файл анализа сэмпла (warp markers, tempo) |
| `.png` / `.jpg` | Изображение | Обложки, thumbnail'ы |

---

## 2. СТРУКТУРА .als XML (детально)

### 2.1 Корневой элемент

```xml
<LiveSet MajorVersion="12" MinorVersion="0">
  <!-- Root attributes -->
</LiveSet>
```

**Версии Live:**
| Major Version | Live Version |
|---------------|-------------|
| 11 | Live 11 |
| 12 | Live 12 |

### 2.1.1 Live Clip (.alc)

Live Clip — отдельный файл с одним клипом + его устройствами:
```xml
<LiveClip>
  <OriginalFilename Value="Sample.wav"/>
  <RelativeFilepath Value="Samples/Import/Sample.wav"/>
  <ClipSettings>...
  <DeviceChain>...  <!-- Устройства клипа -->
</LiveClip>
```

### 2.1.2 Analysis File (.asd)

Содержит:
- Warp markers (позиции привязки к таймлайну)
- Tempo (рассчитанный)
- Default clip settings (gain, warp state, loop)
- Transient markers (обнаруженные пики амплитуды)

### 2.1.3 Device Preset (.adv)

XML файл с параметрами устройства:
```xml
<PluginDevice Device="EQEight"...>
  <Parameter Id="Frequency_1" Value="80.0"/>
  <Parameter Id="Gain_1" Value="-6.0"/>
  ...
</PluginDevice>
```

### 2.2 Live Set Properties

```xml
<LiveSet>
  <Tempo>
    <Manual Value="128.0"/>           <!-- BPM -->
    <AutomationTarget Id="0"/>       <!-- Если автоматизирован -->
  </Tempo>
  
  <TimeSignature>
    <Numerator Value="4"/>           <!-- Числитель -->
    <Denominator Value="4"/>         <!-- Знаменатель -->
  </TimeSignature>
  
  <GlobalGrooveAmount Value="100.0"/> <!-- Сила грува (0-100%) -->
  
  <UniqueID Value="..."/>           <!-- Уникальный ID проекта -->
</LiveSet>
```

### 2.3 Tracks (дорожки)

Каждый трек содержит:

```xml
<AudioTrack Id="0">
  <!-- Имя трека -->
  <EffectiveName Value="Kick"/>
  <Name Value="Kick"/>
  
  <!-- Цвет (integer → hex) -->
  <Color Value="86"/>              <!-- Ableton color index -->
  
  <!-- Видимость -->
  <IsFolded Value="false"/>
  
  <!-- Mixer -->
  <Volume>
    <Manual Value="0.0"/>          <!-- dB (-inf to +6) -->
    <AutomationTarget Id="0"/>
  </Volume>
  <Pan>
    <Manual Value="0.0"/>          <!-- -50 (left) to +50 (right) -->
    <AutomationTarget Id="0"/>
    <PanMode Value="Balanced"/>    <!-- Normal/Balanced -->
  </Pan>
  <Sends>
    <Send>
      <PostPan Value="false"/>
      <PostMixer Value="true"/>
      <Volume>
        <Manual Value="-inf"/>
      </Volume>
    </Send>
    <!-- Повторить для каждого return -->
  </Sends>
  
  <!-- Mute/Solo -->
  <Mute Value="false"/>
  <IsSoloExclusive Value="false"/>
  <Solo.Value Value="false"/>
  
  <!-- Arm (запись) -->
  <Arm.Value Value="false"/>
  <Arm.Exclusive Value="false"/>
  
  <!-- Monitor -->
  <MonitorMode Value="Auto"/>      <!-- Auto/In/Off -->
  
  <!-- Routing -->
  <AudioInputRouting>
    <MidiStatusCode Value="0"/>
    <ExternalValue.Value Value=""/>
    <TrackOn Value="true"/>
    <MidiFrom>                      <!-- MIDI input source -->
      <MidiFromEffectTrack Value="false"/>
      <Target.Value Value=""/>
    </MidiFrom>
    <AudioFrom>
      <AudioFromType Value="0"/>   <!-- 0=Ext, 1=Resampling, 2=Track -->
      <AudioFromChannel.Value Value="post Mixer"/>
      <Track.Value Value=""/>
    </AudioFrom>
  </AudioInputRouting>
  
  <AudioOutputRouting>
    <AudioToType Value="0"/>        <!-- 0=Master, 1=Ext, 2=Track -->
    <AudioOutputChannelString Value="1/2"/>
    <TrackOn Value="true"/>
  </AudioOutputRouting>
  
  <!-- Устройства -->
  <Devices>
    <AudioEffectBranch>
      <BranchDevices>
        <!-- Здесь устройства -->
      </BranchDevices>
    </AudioEffectBranch>
  </Devices>
  
  <!-- MIDI clips -->
  <ArrangementClips>
    <MidiClip>
      <Name Value="Pattern 1"/>
      <Color Value="86"/>
      <ClipStartTime Value="0.0"/>
      <ClipEndTime Value="32.0"/>
      <LoopSettings>
        <LoopStart Value="0.0"/>
        <LoopEnd Value="32.0"/>
        <LoopOn Value="true"/>
      </LoopSettings>
      <Notes>
        <KeyTracks>
          <KeyTrack>
            <MidiKey Value="60"/>      <!-- C4 -->
            <Notes>
              <MidiNoteEvent>
                <Time Value="0.0"/>
                <Duration Value="0.5"/>
                <Velocity Value="100"/>
                <Probability Value="1.0"/>
              </MidiNoteEvent>
            </Notes>
          </KeyTrack>
        </KeyTracks>
      </Notes>
    </MidiClip>
  </ArrangementClips>
  
  <!-- Session clips -->
  <ClipSlots>
    <ClipSlot>
      <Clip>
        <!-- MIDI или Audio clip -->
      </Clip>
    </ClipSlot>
  </ClipSlots>
  
  <!-- Automation -->
  <Envelopes>
    <AutomationLane>
      <Target Id="0"/>              <!-- ID параметра -->
      <Automation>
        <AutomationEvent>
          <Time Value="0.0"/>
          <Value Value="0.75"/>
        </AutomationEvent>
      </Automation>
    </AutomationLane>
  </Envelopes>
</AudioTrack>
```

### 2.4 Devices (цепочки устройств)

#### 2.4.1 Порядок устройств на треке

**Audio Track:**
```
AudioEffect → AudioEffect → AudioEffect → ... → Mixer
```

**MIDI Track:**
```
MidiEffect → MidiEffect → Instrument → AudioEffect → AudioEffect → ... → Mixer
```

**Return Track:**
```
AudioEffect → AudioEffect → ... → Mixer
```

#### 2.4.2 Audio Effects (Live 12)

| XML Tag | Device | Ключевые параметры |
|---------|--------|-------------------|
| `Amp` | Amp | Gain, Volume, Bass/Mid/Treble, Presence, Model(Clean/Boost/Blues/Rock/Lead/Heavy/Bass) |
| `AutoFilter` | Auto Filter | Freq, Res, LFO Rate/Wave/Amount, Env Amount, Drive, FilterCircuit(SVF/DFM/MS2/PRD) |
| `AutoPan` | Auto Pan-Tremolo | Rate, Amount, Phase, Shape(Sine/Tri/Saw/Square/Random), Mode(Panning/Tremolo) |
| `BeatRepeat` | Beat Repeat | Grid, Interval, Gate, Pitch, Decay, Variation |
| `Cabinet` | Cabinet | Mic1/Mic2 Model, Filter, Pan |
| `ChannelEQ` | Channel EQ | Low/Mid/High Gain, HighpassOn |
| `Chorus-Ensemble` | Chorus-Ensemble | Rate, Width, Amount, Mode(Chorus/Ensemble/Phaser) |
| `Compressor` | Compressor | Threshold, Ratio, Attack, Release, Knee, MakeupGain, Sidechain |
| `Delay` | Delay | Time L/R, Feedback, DryWet, PingPong |
| `DrumBuss` | Drum Buss | Drive, Boom, Transient, Dynamics |
| `DynamicTube` | Dynamic Tube | Bias, Tone, DryWet |
| `Echo` | Echo | Time, Feedback, DryWet, Filter, PingPong |
| `EQEight` | EQ Eight | Band1-8: Freq/Gain/Type(SolidShelf/Bell/Notch/HiShelf/LowShelf/BandPass/HiPass/LowPass) |
| `EQThree` | EQ Three | GainLo/Mid/Hi, FreqLo/Hi |
| `Erosion` | Erosion | Amount, Mode(Noise/Sine) |
| `FilterDelay` | Filter Delay | Delay L/R, FilterFreq/Res, DryWet |
| `Gate` | Gate | Threshold, Attack, Hold, Release, Sidechain |
| `GlueCompressor` | Glue Compressor | Threshold, Ratio, Attack, Release, Makeup, DryWet |
| `GrainDelay` | Grain Delay | Grain/Time/Pitch/Feedback, DryWet |
| `HybridReverb` | Hybrid Reverb | Convolution/Algo Blend, Size, Decay, DryWet |
| `Limiter` | Limiter | Threshold, Release |
| `Looper` | Looper | Length, Overdub, Reverse |
| `MultibandDynamics` | Multiband Dynamics | Band1-3: Threshold/Ratio/Attack/Release |
| `Overdrive` | Overdrive | Drive, Tone, DryWet |
| `Pedal` | Pedal | Gain, Tone, Output, Type(Dist/Fuzz/Overdrive) |
| `Phaser-Flanger` | Phaser-Flanger | Rate, Amount, Feedback, LFO Wave |
| `Redux` | Redux | Bit Reduction, Sample Reduction |
| `Resonators` | Resonators | Pitch1-5, Decay, DryWet |
| `Reverb` | Reverb | Size, Decay, Diffusion, DryWet, PreDelay |
| `Roar` | Roar | Mode, Drive, Feedback |
| `Saturator` | Saturator | Drive, Output, Type(SoftClip/HardClip/Wavefolder/SinFold/TanhFold/AnalogClip) |
| `Shifter` | Shifter | Coarse/Fine, DryWet |
| `SpectralResonator` | Spectral Resonator | Frequency, DryWet |
| `SpectralTime` | Spectral Time | DryWet |
| `Spectrum` | Spectrum | (анализатор, параметров нет) |
| `Tuner` | Tuner | Reference Frequency, Tuning (A=440) |
| `Utility` | Utility | Gain, Pan, Width, Phase (invert), Mono |
| `VinylDistortion` | Vinyl Distortion | Tracing Model, Drive |
| `Vocoder` | Vocoder | Carrier, FilterBands, DryWet |
| `ExternalAudioEffect` | External Audio Effect | (proxy к внешнему эффекту) |
| `AutoShift` | Auto Shift | Pitch Correction Amount |

#### 2.4.3 MIDI Effects (Live 12)

| XML Tag | Device | Ключевые параметры |
|---------|--------|-------------------|
| `Arpeggiator` | Arpeggiator | Style(Up/Down/Converge/Diverge/Random/Chord...), Rate, Gate, Distance, Steps, Hold |
| `CCControl` | CC Control | ModWheel, PitchBend, Pressure, CustomA-M (assignable CC) |
| `Chord` | Chord | Shift1-6 (semitones), Velocity1-6, Chance1-6, Strum, Tension |
| `NoteLength` | Note Length | Gate, Length, TriggerSource(On/Off), ReleaseVelocity |
| `Pitch` | Pitch | Pitch (semitones), Step, Lowest, Range, Mode(Block/Fold/Limit) |
| `Random` | Random | Chance, Choices, Interval, Mode(Random/Alt), Sign(Add/Sub/Bi) |
| `Scale` | Scale | Base, ScaleName, Transpose, NoteMatrix(13x13) |
| `Velocity` | Velocity | Mode(Out/Clip), OutHi/Lo, Drive, Compand |

**All MIDI effects support Scale Awareness** (Use Current Scale toggle): transpositions can be in scale degrees instead of semitones.

#### 2.4.4 Instruments (Live 12)

| XML Tag | Device | Ключевые параметры |
|---------|--------|-------------------|
| `InstrumentBranch` (Analog) | Analog | 2 Osc(Saw/Square/Sine/Noise), 2 Filters(LP/HP/BP/Notch/Formant), 2 Amps, 2 LFOs, ADSR, Sub/OscSync |
| `InstrumentBranch` (Collision) | Collision | Resonator type, Excitator, Material |
| `InstrumentBranch` (Drift) | Drift | Oscillators, Filter, Modulation |
| `InstrumentBranch` (DrumSampler) | Drum Sampler | Sample, Volume, Pan, Filter, Start/End |
| `InstrumentBranch` (Electric) | Electric | Tines, Damper, Pickup |
| `InstrumentBranch` (Impulse) | Impulse | 8 Sample slots, Start/Transpose/Filter per slot |
| `InstrumentBranch` (Meld) | Meld | 2 Osc(Wavetable), Filters, LFOs |
| `InstrumentBranch` (Operator) | Operator | 4 Osc(A/B/C/D), Algorithms(1-6), Filter, LFO |
| `InstrumentBranch` (Sampler) | Sampler | Zones(Layer/Key/Velocity), Multi-sample, Filter, Envelopes |
| `InstrumentBranch` (Simpler) | Simpler | Sample, Start/End, Loop, Filter, Envelope, PlaybackMode(Classic/OneShot/Slice) |
| `InstrumentBranch` (Tension) | Tension | String physical model, Exciter |
| `InstrumentBranch` (Wavetable) | Wavetable | 2 Osc(Wavetable position), Filter, LFO, Matrix |

**MIDI tracks:** MIDI Effects → Instrument → Audio Effects

**Note:** Instruments are wrapped in `InstrumentBranch` in the XML. The instrument type is identified by the child element name.

#### 2.4.5 Plug-Ins (сторонние)

```xml
<PluginDevice>
  <VstPluginInfo>
    <!-- VST2/VST3 -->
    <PlugName Value="Serum"/>
    <PlugUniqueID Value="1769238114"/>
    <VstPluginVersion Value="0"/>
    <State>... (сериализованное состояние) ...</State>
  </VstPluginInfo>
</PluginDevice>

<PluginDevice>
  <AudioUnitPluginInfo>
    <!-- Audio Unit (macOS) -->
    <PlugName Value="Serum"/>
    <ComponentType Value="aumu"/>
    <ComponentSubType Value="sfrm"/>
    <State>...</State>
  </AudioUnitPluginInfo>
</PluginDevice>

<PluginDevice>
  <ClapPluginInfo>
    <!-- CLAP формат -->
    <PlugName Value="..."/>
    <State>...</State>
  </ClapPluginInfo>
</PluginDevice>
```

**Plug-In битовый идентификатор:**
- VST2: 4-байтовый код (например `sFPm` = Serum)
- VST3: CLSID в hex
- AU: componentType + componentSubType
- CLAP: unique-id

### 2.5 Сигнал на треке (Signal Flow)

**Audio Track (по умолчанию):**
```
Clip → AudioEffect1 → AudioEffect2 → ... → Mixer (Vol/Pan/Sends) → Output
```

**MIDI Track (по умолчанию):**
```
Clip → MidiEffect1 → MidiEffect2 → Instrument → AudioEffect1 → ... → Mixer → Output
```

**Return Track:**
```
Sends (от клип-треков) → AudioEffect1 → AudioEffect2 → ... → Mixer → Output
```

**Group Track:**
```
[Clip tracks внутри] → Summing → AudioEffect1 → ... → Mixer → Output
```

**Important:** MIDI трек с инструментом:
- До инструмента = MIDI сигнал (MIDI Effects)
- После инструмента = Audio сигнал (Audio Effects)

### 2.6 Racks (Рэки)

#### 2.6.1 Instrument Rack

```xml
<InstrumentBranch>
  <BranchName Value="My Synth Rack"/>
  <BranchColor Value="86"/>
  
  <BranchDevices>
    <!-- MIDI Effects (до инструмента) -->
    <Arpeggiator>
      <Style Value="Up"/>
      <Rate Value="1/16"/>
    </Arpeggiator>
    
    <!-- Инструмент -->
    <InstrumentBranch>
      <BranchDevices>
        <Operator>...</Operator>
      </BranchDevices>
    </InstrumentBranch>
    
    <!-- Audio Effects (после инструмента) -->
    <Chorus-Ensemble>...</Chorus-Ensemble>
    <Reverb>...</Reverb>
  </BranchDevices>
  
  <!-- Macro Controls (до 16) -->
  <MacroControls>
    <MacroControl>
      <MacroName Value="Filter Cutoff"/>
      <MacroValue Value="0.75"/>
      <MacroMidiValue Value="64"/>
    </MacroControl>
    <!-- ... до 16 макро-контролов -->
  </MacroControls>
  
  <!-- Zones (для Instrument/MIDI Effect Racks) -->
  <KeyZone>
    <LValue Value="0"/>        <!-- Минимальная нота -->
    <HValue Value="127"/>      <!-- Максимальная нота -->
    <FadeIn Value="0"/>
    <FadeOut Value="0"/>
  </KeyZone>
  <VelocityZone>
    <LValue Value="1"/>
    <HValue Value="127"/>
    <FadeIn Value="0"/>
    <FadeOut Value="0"/>
  </VelocityZone>
  <ChainSelectZone>
    <LValue Value="0"/>
    <HValue Value="0"/>
  </ChainSelectZone>
</InstrumentBranch>
```

#### 2.6.2 Drum Rack

```xml
<DrumGroupDevice>
  <BranchName Value="My Drum Kit"/>
  
  <DrumPads>
    <DrumPad>
      <Receive.Value Value="36"/>        <!-- C1 = Kick -->
      <Play.Value Value="36"/>
      <Choke.Value Value="0"/>           <!-- Choke group (0=none) -->
      <IsEnabled Value="true"/>
      <Color Value="86"/>
      
      <SampleRef>
        <RelativePathElement>
          <Dir Value="Samples"/>
          <Name Value="Kick.wav"/>
        </RelativePathElement>
      </SampleRef>
      
      <!-- Chain devices -->
      <BranchDevices>
        <Simpler>
          <!-- Сэмплер с параметрами -->
          <SampleRef>...</SampleRef>
          <PlaybackMode Value="1"/>       <!-- 0=Classic, 1=One-Shot, 2=Slice -->
          <Volume Value="0.0"/>
          <Pan Value="0.0"/>
          <FilterEnabled Value="true"/>
          <FilterType Value="1"/>         <!-- LP/HP/BP/Notch -->
          <FilterFreq Value="0.5"/>
          <FilterRes Value="0.0"/>
          <StartValue Value="0.0"/>
          <EndValue Value="1.0"/>
          <LoopStart Value="0.0"/>
          <LoopEnd Value="1.0"/>
          <LoopOn Value="false"/>
          <SnapValue Value="true"/>
        </Simpler>
        <Compressor>...</Compressor>
      </BranchDevices>
    </DrumPad>
    
    <!-- Другие пады -->
    <DrumPad>
      <Receive.Value Value="38"/>        <!-- D1 = Snare -->
      ...
    </DrumPad>
  </DrumPads>
  
  <!-- Return chains (до 6) -->
  <ReturnChains>
    <ReturnChain>
      <BranchName Value="Reverb Send"/>
      <BranchDevices>
        <Reverb>...</Reverb>
      </BranchDevices>
      <ReturnChainVolume Value="0.0"/>
    </ReturnChain>
  </ReturnChains>
  
  <!-- Macro Controls -->
  <MacroControls>...</MacroControls>
</DrumGroupDevice>
```

#### 2.6.3 Audio Effect Rack

```xml
<AudioEffectBranch>
  <BranchName Value="Parallel Processing"/>
  
  <!-- Chain List (параллельные цепочки) -->
  <Branches>
    <AudioEffectBranch>
      <BranchName Value="Clean"/>
      <ChainVolume Value="0.0"/>
      <ChainPan Value="0.0"/>
      <BranchDevices>
        <EQEight>...</EQEight>
      </BranchDevices>
    </AudioEffectBranch>
    <AudioEffectBranch>
      <BranchName Value="Dirty"/>
      <ChainVolume Value="-6.0"/>
      <BranchDevices>
        <Overdrive>...</Overdrive>
        <Compressor>...</Compressor>
      </BranchDevices>
    </AudioEffectBranch>
  </Branches>
  
  <MacroControls>...</MacroControls>
</AudioEffectBranch>
```

### 2.7 Audio Clips

```xml
<MidiClip>  <!-- или AudioClip -->
  <Name Value="Loop 1"/>
  <Color Value="86"/>
  
  <!-- Regioны -->
  <ClipStartTime Value="0.0"/>
  <ClipEndTime Value="8.0"/>
  
  <!-- Loop -->
  <LoopSettings>
    <LoopStart Value="0.0"/>
    <LoopEnd Value="8.0"/>
    <LoopOn Value="true"/>
    <HiddenLoopStart Value="0.0"/>
    <HiddenLoopEnd Value="8.0"/>
  </LoopSettings>
  
  <!-- Warp (для аудио) -->
  <AudioShapers>
    <AudioWarper>
      <WarpMode Value="1"/>              <!-- 0=Beats, 1=Tones, 2=Texture, 3=Re-Pitch, 4=Complex, 5=ComplexPro -->
      <WarpMarkers>
        <WarpMarker>
          <Time Value="0.0"/>
          <AnchorTime Value="0.0"/>
        </WarpMarker>
      </WarpMarkers>
    </AudioWarper>
  </AudioShapers>
  
  <!-- Gain/Pitch -->
  <GuGuTransposition Value="0"/>         <!-- Транспозиция в полутонах -->
  <GuGuVolume Value="100.0"/>            <!-- Громкость (%) -->
  
  <!-- Time Signature -->
  <ClipTimeSignature>
    <Numerator Value="4"/>
    <Denominator Value="4"/>
  </ClipTimeSignature>
  
  <!-- Groove -->
  <GrooveSettings>
    <GrooveId Value="..."/>              <!-- Ссылка на groove из Groove Pool -->
  </GrooveSettings>
  
  <!-- Follow Action -->
  <FollowAction>
    <FollowActionTime>1.0</FollowActionTime>
    <FollowAction Value="0"/>            <!-- 0=None, 1=Stop, 2=PlayAgain, 3=Next, 4=Previous, 5=Random, 6=Other -->
    <FollowActionChanceA Value="1.0"/>
    <FollowActionChanceB Value="0.0"/>
    <IsLinked Value="false"/>
    <LinkType Value="0"/>
  </FollowAction>
  
  <!-- Launch -->
  <Launch>
    <Velocity Value="100"/>
    <Quantization Value="4"/>            <!-- Глобальная квантизация -->
    <IsLaunchable Value="true"/>
    <LaunchMode Value="0"/>              <!-- 0=Trigger, 1=Gate, 2=Toggle, 3=Repeat -->
    <Legato Value="false"/>
  </Launch>
  
  <!-- Notes (для MIDI) -->
  <Notes>
    <KeyTracks>
      <KeyTrack>
        <MidiKey Value="60"/>
        <Notes>
          <MidiNoteEvent>
            <Time Value="0.0"/>
            <Duration Value="0.5"/>
            <Velocity Value="100"/>
            <Probability Value="1.0"/>
          </MidiNoteEvent>
        </Notes>
      </KeyTrack>
    </KeyTracks>
    <ControllerChains>
      <ControllerChain>
        <MidiCCNo Value="1"/>            <!-- Mod Wheel -->
        <MidiCCChain>
          <Events>
            <MidiCCEvent>
              <Time Value="0.0"/>
              <Value Value="64"/>
            </MidiCCEvent>
          </Events>
        </MidiCCChain>
      </ControllerChain>
    </ControllerChains>
  </Notes>
  
  <!-- Clip Envelopes -->
  <Envelopes>
    <AutomationLane>
      <Target Id="0"/>
      <Automation>...</Automation>
    </AutomationLane>
  </Envelopes>
  
  <!-- Scale -->
  <ScaleSettings>
    <IsEnabled Value="false"/>
    <RootNote Value="0"/>                <!-- C -->
    <ScaleId Value="0"/>                 <!-- Major -->
  </ScaleSettings>
</MidiClip>
```

### 2.8 Automation

```xml
<AutomationLane>
  <Target Id="0"/>                        <!-- ID параметра для автоматизации -->
  <LomId Value="0"/>
  <IsEnabled Value="true"/>
  <Automation>
    <AutomationEvent>
      <Time Value="0.0"/>
      <Value Value="0.75"/>
    </AutomationEvent>
    <AutomationEvent>
      <Time Value="4.0"/>
      <Value Value="0.50"/>
    </AutomationEvent>
  </Automation>
</AutomationLane>
```

### 2.9 Groove Pool

```xml
<GroovePool>
  <Grooves>
    <AudioToMidiGroove>
      <Name Value="Swing 56"/>
      <FilePath Value="Grooves/Swing 56.agr"/>
      <Timing Value="100.0"/>             <!-- Сила тайминга -->
      <Random Value="0.0"/>               <!-- Случайность -->
      <Velocity Value="0.0"/>             <!-- Влияние на velocity -->
      <Quantization Value="100.0"/>       <!-- Квантизация -->
    </AudioToMidiGroove>
  </Grooves>
</GroovePool>
```

### 2.10 Return Tracks

```xml
<ReturnTrack>
  <Name Value="Reverb"/>
  <Volume>
    <Manual Value="0.0"/>
  </Volume>
  <Pan>
    <Manual Value="0.0"/>
  </Pan>
  <Devices>
    <AudioEffectBranch>
      <BranchDevices>
        <Reverb>...</Reverb>
      </BranchDevices>
    </AudioEffectBranch>
  </Devices>
</ReturnTrack>
```

### 2.11 Master Track

```xml
<MasterTrack>
  <Volume>
    <Manual Value="0.0"/>
  </Volume>
  <Pan>
    <Manual Value="0.0"/>
  </Pan>
  <CrossfaderAssignment Value="0"/>
  <Sends>
    <!-- Return sends -->
  </Sends>
  <Devices>
    <!-- Master effects chain -->
  </Devices>
</MasterTrack>
```

### 2.12 Warp Modes

| WarpMode Value | Название | Описание |
|----------------|----------|----------|
| 0 | Beats | Для ритмических сэмплов (ударные, петли) |
| 1 | Tones | Для мелодических сэмплов (вокал, гитара) |
| 2 | Texture | Для текстурных сэмплов (планы, эмбиент) |
| 3 | Re-Pitch | Аналоговый стиль (pitch + tempo связаны) |
| 4 | Complex | Для сложных сигналов (миксы, песни) |
| 5 | Complex Pro | Улучшенный Complex (лучшее качество) |

### 2.13 Clip Launch Modes

| LaunchMode Value | Режим | Поведение |
|------------------|-------|----------|
| 0 | Trigger | Down запускает, Up игнорируется |
| 1 | Gate | Down запускает, Up останавливает |
| 2 | Toggle | Down запускает, следующий Down останавливает |
| 3 | Repeat | Повторно запускает пока зажат |

### 2.14 Follow Actions

| FollowAction Value | Действие |
|--------------------|----------|
| 0 | No Action |
| 1 | Stop |
| 2 | Play Again |
| 3 | Previous |
| 4 | Next |
| 5 | First |
| 6 | Last |
| 7 | Any |
| 8 | Other |
| 9 | Jump (с Target) |

**Linked/Unlinked:**
- Linked: Follow Action происходит в конце клипа или после N loop'ов
- Unlinked: Follow Action происходит через Follow Action Time

### 2.15 Routing и I/O

**Input Types:**
| AudioFromType | Описание |
|---------------|----------|
| 0 | External (Ext. In) — микрофон, инструмент |
| 1 | Resampling — Main output |
| 2 | Track — другой трек |

**Output Types:**
| AudioToType | Описание |
|------------|----------|
| 0 | Master — Main output |
| 1 | External (Ext. Out) — конкретный выход |
| 2 | Track — другой трек (sidechain) |

**Tap Points (для AudioFrom):**
- Pre FX — до устройств
- Post FX — после устройств, до микшера
- Post Mixer — после микшера

### 2.16 Zones (для Racks)

**Key Zones:**
- LValue: минимальная нота (0-127)
- HValue: максимальная нота (0-127)
- FadeIn/FadeOut:.fade-in/out

**Velocity Zones:**
- LValue: минимальная velocity (1-127)
- HValue: максимальная velocity (1-127)
- FadeIn/FadeOut

**Chain Select Zones:**
- LValue: минимальное значение (0-127)
- HValue: максимальное значение (0-127)
- FadeIn/FadeOut

**Drum Rack:**
- Receive: MIDI note number (0-127)
- Play: outgoing note
- Choke: choke group (0=none, 1-16)

### 2.17 Groove Pool

Грувы — параметры квантования и swing:

```xml
<GroovePool>
  <Grooves>
    <AudioToMidiGroove>
      <Name Value="Swing 56"/>
      <FilePath Value="Grooves/Swing 56.agr"/>
      <Timing Value="100.0"/>      <!-- Сила тайминга (0-100%) -->
      <Random Value="0.0"/>         <!-- Случайность тайминга -->
      <Velocity Value="0.0"/>       <!-- Влияние на velocity -->
      <Quantization Value="100.0"/>  <!-- Квантизация -->
    </AudioToMidiGroove>
  </Grooves>
</GroovePool>
```

### 2.18 MIDI Clip Properties

```xml
<MidiClip>
  <Name Value="Pattern 1"/>
  <Color Value="86"/>
  <ClipStartTime Value="0.0"/>
  <ClipEndTime Value="32.0"/>
  <LoopSettings>...</LoopSettings>
  <Notes>
    <KeyTracks>
      <KeyTrack>
        <MidiKey Value="60"/>
        <Notes>
          <MidiNoteEvent>
            <Time Value="0.0"/>
            <Duration Value="0.5"/>
            <Velocity Value="100"/>
            <Probability Value="1.0"/>
          </MidiNoteEvent>
        </Notes>
      </KeyTrack>
    </KeyTracks>
    <ControllerChains>
      <ControllerChain>
        <MidiCCNo Value="1"/>          <!-- Mod Wheel -->
        <MidiCCChain>
          <Events>
            <MidiCCEvent>
              <Time Value="0.0"/>
              <Value Value="64"/>
            </MidiCCEvent>
          </Events>
        </MidiCCChain>
      </ControllerChain>
    </ControllerChains>
  </Notes>
  <ClipTimeSignature>
    <Numerator Value="4"/>
    <Denominator Value="4"/>
  </ClipTimeSignature>
  <ScaleSettings>
    <IsEnabled Value="false"/>
    <RootNote Value="0"/>
    <ScaleId Value="0"/>
  </ScaleSettings>
  <Launch>
    <Velocity Value="100"/>
    <Quantization Value="4"/>
    <IsLaunchable Value="true"/>
    <LaunchMode Value="0"/>
    <Legato Value="false"/>
  </Launch>
  <FollowAction>...</FollowAction>
  <Envelopes>...</Envelopes>
</MidiClip>
```

### 2.19 Audio Clip Properties

```xml
<AudioClip>
  <Name Value="Loop 1"/>
  <Color Value="86"/>
  <ClipStartTime Value="0.0"/>
  <ClipEndTime Value="8.0"/>
  <LoopSettings>...</LoopSettings>
  <AudioShapers>
    <AudioWarper>
      <WarpMode Value="1"/>
      <WarpMarkers>...</WarpMarkers>
    </AudioWarper>
  </AudioShapers>
  <GuGuTransposition Value="0"/>
  <GuGuVolume Value="100.0"/>
  <GuGuPan Value="0.0"/>
  <GuGuPanMode Value="Balanced"/>
  <FadeInLength Value="0"/>
  <FadeOutLength Value="0"/>
  <RamMode Value="false"/>
  <HighQualityInterpolation Value="false"/>
  <SampleRef>
    <RelativePathElement>
      <Dir Value="Samples"/>
      <Name Value="Loop.wav"/>
    </RelativePathElement>
  </SampleRef>
</AudioClip>
```

---

## 3. ЧТО ИЗВЛЕКАЕМ ДЛЯ UI (приоритизированно)

### 3.1 Приоритет 1: Receipt-View (обзор проекта)

| Что | Как извлекаем | UI отображение |
|-----|--------------|----------------|
| **Project Name** | Имя .als файла | Заголовок |
| **Live Version** | `MajorVersion.MinorVersion` | "Ableton Live 12" |
| **BPM** | `Tempo/Manual/@Value` | "128 BPM" |
| **Time Signature** | `TimeSignature/Numerator/Denominator` | "4/4" |
| **Total Tracks** | `count(Tracks/*)` | "12 tracks" |
| **Total Samples** | `count(//SampleRef)` | "247 samples" |
| **Total Presets** | `count(//PresetRef)` + `.adv/.adg/.xpl` files | "34 presets" |
| **Groove** | `GroovePool/Grooves` | "Swing 56" |

### 3.2 Приоритет 2: Track List

Для каждого трека:

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **Name** | `EffectiveName/@Value` или `Name/@Value` | Название |
| **Type** | XML tag name | Иконка (audio/midi/group/return) |
| **Color** | `Color/@Value` → Ableton color palette → hex | Цветная полоска |
| **Volume** | `Volume/Manual/@Value` | "0.0 dB" |
| **Pan** | `Pan/Manual/@Value` | "C" / "L15" / "R30" |
| **Mute** | `Mute/@Value` | 🔇 если muted |
| **Solo** | `Solo.Value/@Value` | 🔊 если solo |
| **Arm** | `Arm.Value/@Value` | ⚫ если armed |
| **Device Chain** | Список устройств (порядок!) | "EQ Eight → Compressor → Reverb" |
| **Clip Count** | `count(ArrangementClips/*) + count(ClipSlots/*/Clip)` | "3 clips" |
| **MIDI Clips** | Список MIDI клипов | "Pattern 1 (8 bars)" |
| **Audio Clips** | Список аудио клипов | "Loop 1 (4 bars, warped)" |

### 3.3 Приоритет 3: Devices & Plugins

Для каждого устройства:

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **Device Name** | XML tag name | "EQ Eight" |
| **Device Type** | Классификация (builtin/VST/AU/CLAP) | Иконка |
| **Is Enabled** | `IsEnabled/@Value` | On/Off |
| **Preset Name** | Если preset loaded | "Preset Name" |
| **Parameters** | Ключевые параметры (см. ниже) | Значения |
| **Sidechain** | Если используется sidechain | "Sidechain from Track X" |
| **Chain Position** | Порядок в цепочке | left-to-right |

**Ключевые параметры по устройствам:**

| Device | Ключевые параметры |
|--------|-------------------|
| EQ Eight | Band frequencies, gains, types (8 полос) |
| Compressor | Threshold, Ratio, Attack, Release, Knee |
| Reverb | Room Size, Decay, Dry/Wet, Pre-Delay |
| Delay | Time, Feedback, Dry/Wet, Ping Pong |
| Auto Filter | Freq, Res, LFO Rate, Envelope Amount |
| Saturator | Drive, Output, Type |
| Utility | Gain, Pan, Width, Phase, Mono |
| Operator | 4 Oscillator levels, Filter, LFO |
| Wavetable | Position, Filter, Envelopes |
| Simpler | Sample, Start, End, Filter, Envelope |
| Drum Rack | Pad assignments (note → sample) |
| Reverb | Size, Decay, Diffusion, Dry/Wet |

### 3.4 Приоритет 4: Samples

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **File Path** | `SampleRef/RelativePathElement` | "Samples/Kick.wav" |
| **Format** | Расширение | "WAV" / "AIFF" / "FLAC" |
| **Sample Rate** | WAV header (или .asd) | "44100 Hz" / "48000 Hz" |
| **Bit Depth** | WAV header | "16-bit" / "24-bit" / "32-bit float" |
| **Channels** | WAV header | "Mono" / "Stereo" |
| **Duration** | WAV header | "3.2s" |
| **File Size** | ZIP entry size | "1.2 MB" |
| **Used By** | Ссылки из клипов | "Used in: Kick (MidiTrack 1)" |

### 3.5 Приоритет 5: Plugin Registry

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **Plugin Name** | `PlugName/@Value` | "Serum" |
| **Plugin Type** | VST2/VST3/AU/CLAP | "VST3" |
| **Plugin ID** | `PlugUniqueID/@Value` | Для идентификации |
| **Is Built-in** | Сравнение с known Ableton devices | ✅/⚠️ |
| **Instances** | Количество использований | "×2" |
| **Required** | Если нет в Core Library | ⚠️ "Required" |

**Known Ableton Built-in Devices (не требуют установки):**

```python
LIVE_AUDIO_EFFECTS = {
    "Amp", "Auto Filter", "Auto Pan-Tremolo", "Auto Shift",
    "Beat Repeat", "Cabinet", "Channel EQ", "Chorus-Ensemble",
    "Compressor", "Corpus", "Delay", "Drum Buss", "Dynamic Tube",
    "Echo", "EQ Eight", "EQ Three", "Erosion",
    "External Audio Effect", "Filter Delay", "Gate",
    "Glue Compressor", "Grain Delay", "Hybrid Reverb",
    "Limiter", "Looper", "Multiband Dynamics",
    "Overdrive", "Pedal", "Phaser-Flanger",
    "Redux", "Resonators", "Reverb", "Roar",
    "Saturator", "Shifter", "Spectral Resonator",
    "Spectral Time", "Spectrum", "Tuner",
    "Utility", "Vinyl Distortion", "Vocoder",
}

LIVE_MIDI_EFFECTS = {
    "Arpeggiator", "CC Control", "Chord",
    "Note Length", "Pitch", "Random", "Scale", "Velocity",
}

LIVE_INSTRUMENTS = {
    "Analog", "Collision", "Drift", "Drum Sampler",
    "Electric", "External Instrument", "Impulse",
    "Meld", "Operator", "Sampler", "Simpler",
    "Tension", "Wavetable",
}
```

### 3.6 Приоритет 6: Drum Rack Pads

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **MIDI Note** | `DrumPad/Receive/@Value` | "C1 (36)" |
| **GM Drum Name** | Маппинг note → GM | "Kick Drum" |
| **Sample** | `DrumPad/SampleRef` | "Kick.wav" |
| **Chain Devices** | Список устройств в цепочке пада | "Simpler → Compressor" |
| **Choke Group** | `DrumPad/Choke/@Value` | "Choke 1" |
| **Is Enabled** | `DrumPad/IsEnabled/@Value` | On/Off |
| **Color** | `DrumPad/Color/@Value` | Цвет пада |
| **Volume** | `DrumPad/Volume/@Value` | "-3.0 dB" |
| **Pan** | `DrumPad/Pan/@Value` | "L10" |

### 3.7 Приоритет 7: MIDI Content

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **Note Count** | `count(//MidiNoteEvent)` | "247 notes" |
| **Note Range** | min/max MidiKey | "C2 - C5" |
| **Velocity Range** | min/max Velocity | "40 - 127" |
| **Scale** | `ScaleSettings/RootNote + ScaleId` | "C Minor" |
| **Quantization** | `Quantization` | "1/16" |
| **Probability** | `Probability` | "100%" |

### 3.8 Приоритет 8: Audio Clip Details

| Что | Как извлекаем | UI |
|-----|--------------|-----|
| **Warp Mode** | `WarpMode` | "Beats" / "Tones" / "Complex" |
| **Loop Settings** | `LoopOn, LoopStart, LoopEnd` | "Loop: 0.0 - 8.0" |
| **Transpose** | `GuGuTransposition` | "+2 semitones" |
| **Gain** | `GuGuVolume` | "-3 dB" |
| **Fade In/Out** | `FadeInLength/FadeOutLength` | "10ms fade" |
| **RAM Mode** | `RamMode` | "RAM" / "Disk" |

---

## 4. ЧТО НЕ ПАРСИМ (избыточно)

| Что | Почему не нужно |
|-----|----------------|
| Automation breakpoints | Визуальная деталь, не для receipt-view |
| Warp markers | Внутренняя настройка |
| Clip envelopes (детально) | Модуляция, не для overview |
| MIDI Map assignments | Привязка к контроллерам |
| Groove Pool (детально) | Нюансы квантования |
| Return track routing details | Техническая деталь |
| Video tracks | Rare |
| Follow Action settings | Performance detail |
| Crossfader assignments | DJ-specific |
| MPE data | Advanced |
| Scale settings per clip | Minor detail |
| Default presets | User preference |

---

## 5. ТЕКУЩИЙ СТАТУС ПАРСЕРА

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

#### Критично для UI:
- ❌ Track color (integer → hex conversion)
- ❌ Track volume/pan values
- ❌ Device chain order (порядок устройств)
- ❌ Device enabled/disabled status
- ❌ Plugin type classification (builtin vs VST vs AU)
- ❌ Drum Rack pad mapping (note → sample → devices)
- ❌ Rack structure (chains, macro controls)
- ❌ Sample metadata (sample rate, bit depth, duration, channels)

#### Важно для v2:
- ❌ MIDI clip content (ноты, velocity, probability)
- ❌ Audio clip properties (warp mode, loop settings)
- ❌ Automation lanes
- ❌ Groove pool
- ❌ Return track structure
- ❌ Master track effects
- ❌ Sidechain routing
- ❌ Macro control mappings

#### Для C++ worker:
- ❌ Streaming ZIP parsing (сейчас загружает всё в память)
- ❌ Incremental SHA-256
- ❌ Parallel XML parsing
- ❌ WAV header reading

---

## 6. Архитектура C++ Worker

```
Input: ALP blob (streaming from GCS)
  │
  ├─ ZIP stream reader (minizip/zlib)
  │   │
  │   ├─ For each entry (one at a time):
  │   │   │
  │   │   ├─ .als → decompress gzip → parse XML (pugixml)
  │   │   │   ├─ Extract: tracks, devices, plugins, samples
  │   │   │   ├─ Extract: BPM, time signature, version
  │   │   │   ├─ Extract: track colors, volumes, pan
  │   │   │   ├─ Extract: device chain order
  │   │   │   ├─ Extract: plugin names and types
  │   │   │   ├─ Extract: Drum Rack pad mappings
  │   │   │   └─ Extract: sample references with metadata
  │   │   │
  │   │   ├─ .adv/.adg/.xpl → parse preset metadata
  │   │   │   ├─ Device type
  │   │   │   ├─ Parameter values (key params only)
  │   │   │   └─ Parent track reference
  │   │   │
  │   │   ├─ .wav/.aiff → read header (NOT full file)
  │   │   │   ├─ Sample rate
  │   │   │   ├─ Bit depth
  │   │   │   ├─ Channels
  │   │   │   ├─ Duration
  │   │   │   └─ Incremental SHA-256 (EVP)
  │   │   │
  │   │   ├─ .asd → extract warp markers (optional)
  │   │   │
  │   │   └─ other → skip
  │   │
  │   └─ Output: JSON with full project metadata
  │
  └─ Output to stdout → Python reads → StorageObject.metadata_json
```

---

## 7. Receipt-Style UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 TheForgebyHecq - Ableton Live Pack v9.1                    │
│  BPM: 128 | 4/4 | 12 tracks | 247 samples | 34 presets        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎵 Kick             [#FF6F61] ────── Vol: 0.0dB Pan: C        │
│    ├─ Drum Rack (4 pads)                                        │
│    │   ├─ C1: Kick.wav → Simpler → Compressor → EQ Eight       │
│    │   ├─ D1: Snare.wav → Simpler → Drum Buss                  │
│    │   ├─ F#1: HiHat.wav → Simpler                             │
│    │   └─ A#1: Cymbal.wav → Simpler → Reverb                   │
│    └─ Macros: Volume(75%), Filter(50%)                          │
│                                                                 │
│  🎵 Bass             [#6ECFF6] ────── Vol: -3dB Pan: C         │
│    ├─ Serum (VST3) → SSL Compressor → ValhallaRoom             │
│    ├─ MIDI: "Bass Line" (16 bars, 89 notes, C minor)           │
│    └─ ⚠️ Requires: Serum (x2), ValhallaRoom                    │
│                                                                 │
│  🎵 Lead             [#A8E6CF] ────── Vol: -6dB Pan: L15       │
│    ├─ Operator → Auto Filter → Chorus → Reverb                  │
│    ├─ MIDI: "Lead Melody" (8 bars, 127 notes)                   │
│    └─ Macros: Cutoff(60%), Resonance(40%)                       │
│                                                                 │
│  🎵 Pads             [#FFD93D] ────── Vol: -12dB Pan: R20      │
│    ├─ Wavetable → Echo → Hybrid Reverb                         │
│    ├─ Audio: "Pad Loop" (32 bars, warped, Complex mode)         │
│    └─ Loop: 0.0 - 8.0 bars                                     │
│                                                                 │
│  🎵 Drums Bus        [Group] ────── 3 tracks                   │
│    ├─ Kick, Snare, HiHat (nested)                               │
│    └─ Drum Buss → Glue Compressor                               │
│                                                                 │
│  ... (7 more tracks)                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📊 Summary                                                     │
│  ├─ Instruments: Operator, Wavetable, Drum Rack, Serum          │
│  ├─ Effects: EQ Eight(×3), Compressor(×4), Reverb(×3)...      │
│  ├─ VST Plugins: Serum (×2), FabFilter Pro-Q (×1)              │
│  ├─ Audio: 247 files (1.2GB total)                             │
│  ├─ MIDI Clips: 8                                               │
│  └─ Return Tracks: Reverb, Delay                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Plugin Registry View

```
┌─────────────────────────────────────────────────────────────┐
│  🔌 Required Plugins                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Built-in (Live 12) — 38 devices                         │
│    Amp, Auto Filter, Beat Repeat, Cabinet, Chorus...        │
│    (полный список в LIVE_AUDIO_EFFECTS)                     │
│                                                             │
│  ⚠️ Third-party VST3                                        │
│    Serum (×2) — by Xfer Records                             │
│    FabFilter Pro-Q 3 — by FabFilter                         │
│    ValhallaRoom — by Valhalla DSP                           │
│                                                             │
│  ⚠️ Third-party AU (macOS only)                              │
│    (нет)                                                    │
│                                                             │
│  ⚠️ Third-party CLAP                                        │
│    (нет)                                                    │
│                                                             │
│  ℹ️ Max for Live Devices                                     │
│    (нет)                                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. URL-формат для SoundHub

```
/p/{username}                       — Portfolio (список проектов)
/projects/{id}                      — Project view (receipt-style)
/projects/{id}#tracks               — Track list
/projects/{id}#track-{slug}        — Jump to specific track
/projects/{id}#plugins             — Plugin registry
/projects/{id}#samples             — Sample catalog
/projects/{id}#drum-racks          — Drum Rack overview
```

---

## 10. Minimum Viable ALP Support (MVP)

### Что нужно для MVP:
1. **Полный парсинг XML** — все треки, устройства, плагины, сэмплы
2. **Track colors** — Ableton color palette → hex
3. **Device chain order** — порядок устройств
4. **Plugin classification** — builtin vs VST vs AU
5. **Drum Rack pads** — note → sample mapping
6. **Sample metadata** — sample rate, bit depth, duration
7. **Receipt-style UI** — дерево треков → устройств → плагинов
8. **Plugin registry** — список требуемых плагинов
9. **Streaming обработка** — для multi-GB ALP

### Что для v2:
- Waveform для сэмплов
- MIDI clip preview (ноты в Piano Roll)
- Loudness analysis
- Sound similarity tags
- Automation visualization
- Groove pool
- Macro control display

### Что для v3:
- Real-time preview (play samples)
- Collaboration features
- Version comparison
- A/B testing between ALP versions
