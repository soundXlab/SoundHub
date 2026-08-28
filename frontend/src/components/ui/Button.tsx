import React from 'react';
import { colors, radii, spacing, typography } from '../../design-tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  style,
  disabled,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.semiBold,
    fontSize: size === 'sm' ? '10px' : size === 'lg' ? '12px' : '11px',
    borderRadius: radii.sm,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.1s ease',
    opacity: disabled || loading ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    letterSpacing: '0.2px',
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: colors.brand.primary,
      color: colors.text.inverse,
      border: `1px solid ${colors.brand.primary}`,
    },
    secondary: {
      background: 'transparent',
      color: colors.brand.primary,
      border: `1px solid ${colors.brand.primary}`,
    },
    ghost: {
      background: 'transparent',
      color: colors.text.secondary,
      border: `1px solid ${colors.border.default}`,
    },
    danger: {
      background: colors.error,
      color: colors.text.primary,
      border: `1px solid ${colors.error}`,
    },
    outline: {
      background: 'transparent',
      color: colors.text.primary,
      border: `1px solid ${colors.border.default}`,
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '2px 8px' },
    md: { padding: '4px 12px' },
    lg: { padding: '6px 16px' },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span style={{ marginRight: '4px' }}>⏳</span>}
      {children}
    </button>
  );
};

export default Button;
