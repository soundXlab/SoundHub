import React from 'react';
import { colors, radii, spacing, typography } from '../../design-tokens';

export interface AudioPlayerProps {
  src?: string;
  title?: string;
  artist?: string;
  duration?: number;
  waveform?: number[];
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  artist,
  duration = 0,
  waveform = [],
  onPlay,
  onPause,
  onSeek,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  };

  const waveformBars = waveform.length > 0 ? waveform : 
    Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);

  return (
    <div
      style={{
        background: colors.bg.surface,
        borderRadius: radii.sm,
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header with title */}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: typography.fontSize.body,
              fontWeight: 600,
              color: colors.text.primary,
            }}>
              {title}
            </div>
            {artist && (
              <div style={{
                fontSize: '10px',
                color: colors.text.muted,
                marginTop: '1px',
              }}>
                {artist}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waveform visualization — DaVinci timeline style */}
      <div
        style={{
          position: 'relative',
          height: '60px',
          background: colors.bg.elevated,
          borderRadius: radii.sm,
          overflow: 'hidden',
          cursor: 'pointer',
          border: `1px solid ${colors.border.default}`,
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          const newTime = percent * duration;
          setCurrentTime(newTime);
          onSeek?.(newTime);
        }}
      >
        {/* Waveform bars */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
          padding: '0 8px',
        }}>
          {waveformBars.map((value, i) => {
            const percent = i / waveformBars.length;
            const isPlayed = percent <= currentTime / duration;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${value * 100}%`,
                  minHeight: '2px',
                  background: isPlayed ? colors.brand.primary : colors.text.muted,
                  borderRadius: '1px',
                  transition: 'background 0.05s ease',
                  opacity: isPlayed ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>

        {/* Playhead — DaVinci style thin line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${(currentTime / duration) * 100}%`,
            width: '2px',
            background: colors.brand.primary,
            opacity: isPlaying || isHovering ? 1 : 0,
            transition: 'opacity 0.1s ease',
            zIndex: 2,
          }}
        />

        {/* Time indicators */}
        <div style={{
          position: 'absolute',
          bottom: '3px',
          left: '6px',
          fontFamily: typography.fontFamily.mono,
          fontSize: '9px',
          color: colors.text.muted,
          zIndex: 3,
        }}>
          {formatTime(currentTime)}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '3px',
          right: '6px',
          fontFamily: typography.fontFamily.mono,
          fontSize: '9px',
          color: colors.text.muted,
          zIndex: 3,
        }}>
          {formatTime(duration)}
        </div>
      </div>

      {/* Controls — compact DaVinci transport */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <button
            onClick={handlePlayPause}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: colors.brand.primary,
              border: 'none',
              color: colors.text.inverse,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Volume — compact slider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          flex: 1,
          maxWidth: '100px',
        }}>
          <span style={{ color: colors.text.muted, fontSize: '10px' }}>🔊</span>
          <div style={{
            flex: 1,
            height: '3px',
            background: colors.bg.elevated,
            borderRadius: '2px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '70%',
              background: colors.brand.secondary,
              borderRadius: '2px',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
