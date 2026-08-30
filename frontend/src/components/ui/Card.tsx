import React from 'react';
import { colors, radii, spacing, typography } from '../../design-tokens';

export interface CardProps {
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}

const paddingMap = {
  none: '0',
  sm: spacing.sm + 'px',
  md: spacing.lg + 'px',
  lg: spacing.xl + 'px',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
}) => {
  const baseStyles: React.CSSProperties = {
    background: variant === 'elevated' ? colors.bg.elevated : colors.bg.surface,
    border: `1px solid ${colors.border.default}`,
    borderRadius: radii.sm,
    padding: paddingMap[padding],
    transition: 'all 0.1s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (variant === 'interactive') {
          e.currentTarget.style.borderColor = colors.brand.primary;
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (variant === 'interactive') {
          e.currentTarget.style.borderColor = colors.border.default;
        }
        onMouseLeave?.(e);
      }}
    >
      {children}
    </div>
  );
};

// Card sub-components — compact DaVinci style
export const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ marginBottom: spacing.md }}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 style={{
    margin: 0,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    letterSpacing: '0.2px',
  }}>
    {children}
  </h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    margin: 0,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: '2px',
  }}>
    {children}
  </p>
);

export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.border.default}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  }}>
    {children}
  </div>
);

export default Card;
