import React from 'react';
import { colors, radii, typography } from '../../design-tokens';

export interface BadgeProps {
  variant?: 'draft' | 'processing' | 'ready' | 'error' | 'archived' | 'secondary' | 'ghost';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

const variantColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: colors.bg.elevated, text: colors.text.muted },
  processing: { bg: colors.warning + '20', text: colors.warning },
  ready: { bg: colors.success + '20', text: colors.success },
  error: { bg: colors.error + '20', text: colors.error },
  archived: { bg: colors.text.muted + '20', text: colors.text.muted },
  secondary: { bg: colors.bg.elevated, text: colors.text.secondary },
  ghost: { bg: 'transparent', text: colors.text.muted },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'draft',
  children,
  size = 'md',
  style,
  className,
}) => {
  const { bg, text } = variantColors[variant];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: text,
        fontFamily: typography.fontFamily.body,
        fontWeight: typography.fontWeight.semiBold,
        fontSize: size === 'sm' ? '8px' : '9px',
        padding: size === 'sm' ? '1px 4px' : '2px 6px',
        borderRadius: radii.sm,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
