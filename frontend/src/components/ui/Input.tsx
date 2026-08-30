import React from 'react';
import { colors, radii, spacing, typography } from '../../design-tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {label && (
          <label style={{
            fontSize: '10px',
            fontWeight: 500,
            color: colors.text.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span style={{
              position: 'absolute',
              left: '8px',
              color: colors.text.muted,
              fontSize: '10px',
            }}>
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            style={{
              width: '100%',
              height: '26px',
              padding: leftIcon ? '3px 8px 3px 28px' : '3px 8px',
              background: colors.bg.primary,
              border: `1px solid ${error ? colors.error : colors.border.default}`,
              borderRadius: radii.sm,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.body,
              outline: 'none',
              transition: 'border-color 0.1s ease',
              boxSizing: 'border-box',
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? colors.error : colors.brand.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? colors.error : colors.border.default;
            }}
            {...props}
          />
          {rightIcon && (
            <span style={{
              position: 'absolute',
              right: '8px',
              color: colors.text.muted,
              fontSize: '10px',
            }}>
              {rightIcon}
            </span>
          )}
        </div>
        {(error || helperText) && (
          <span style={{
            fontSize: '9px',
            color: error ? colors.error : colors.text.muted,
          }}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
