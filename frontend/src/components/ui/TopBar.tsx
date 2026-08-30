import React from 'react';
import { colors, spacing, typography, layout, radii } from '../../design-tokens';

export interface TopBarProps {
  logo?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  logo,
  title,
  children,
  actions,
  sticky = true,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${spacing.xl}`,
        borderBottom: `1px solid ${colors.border.default}`,
        background: colors.bg.toolbar,
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
        gap: spacing.md,
        height: layout.topbar.height,
        boxSizing: 'border-box',
      }}
    >
      {/* Left section: Logo + Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
      }}>
        {logo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '18px',
          }}>
            {logo}
          </div>
        )}
        {title && (
          <span style={{
            fontFamily: typography.fontFamily.body,
            fontWeight: typography.fontWeight.bold,
            fontSize: typography.fontSize.h3,
            color: colors.text.primary,
            letterSpacing: '-0.3px',
          }}>
            {title}
          </span>
        )}
      </div>

      {/* Center section: Navigation */}
      {children && (
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          flex: 1,
          justifyContent: 'center',
        }}>
          {children}
        </nav>
      )}

      {/* Right section: Actions */}
      {actions && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          {actions}
        </div>
      )}
    </header>
  );
};

// TopBar navigation link — DaVinci tab style
export interface TopBarLinkProps {
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const TopBarLink: React.FC<TopBarLinkProps> = ({
  href,
  active = false,
  children,
  onClick,
}) => {
  return (
    <a
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.sm} ${spacing.md}`,
        fontSize: typography.fontSize.body,
        fontWeight: typography.fontWeight.medium,
        color: active ? colors.text.primary : colors.text.muted,
        borderBottom: active ? `2px solid ${colors.brand.primary}` : '2px solid transparent',
        textDecoration: 'none',
        transition: 'all 0.1s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = colors.text.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = colors.text.muted;
        }
      }}
    >
      {children}
    </a>
  );
};

// TopBar search input — compact DaVinci style
export interface TopBarSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
}

export const TopBarSearch: React.FC<TopBarSearchProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
}) => {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch?.(e.currentTarget.value);
          }
        }}
        style={{
          width: '240px',
          height: '24px',
          padding: `${spacing.xs} ${spacing.md}`,
          paddingLeft: '28px',
          background: colors.bg.primary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radii.sm,
          color: colors.text.primary,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.body,
          outline: 'none',
          transition: 'border-color 0.1s ease',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.brand.primary;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border.default;
        }}
      />
      <span style={{
        position: 'absolute',
        left: spacing.md,
        color: colors.text.muted,
        fontSize: typography.fontSize.body,
        pointerEvents: 'none',
      }}>
        🔍
      </span>
    </div>
  );
};

// TopBar user menu — compact
export interface TopBarUserMenuProps {
  username?: string;
  avatar?: string;
  notifications?: number;
  onLogout?: () => void;
}

export const TopBarUserMenu: React.FC<TopBarUserMenuProps> = ({
  username,
  avatar,
  notifications = 0,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: spacing.xs,
          borderRadius: radii.sm,
          transition: 'background 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.bg.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={username}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: colors.bg.elevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: typography.fontSize.small,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.muted,
          }}>
            {username?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        {notifications > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            minWidth: '12px',
            height: '12px',
            padding: '0 3px',
            borderRadius: '6px',
            background: colors.error,
            color: colors.text.primary,
            fontSize: '8px',
            fontWeight: typography.fontWeight.bold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {notifications > 99 ? '99+' : notifications}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: spacing.xs,
            minWidth: '160px',
            background: colors.bg.elevated,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radii.sm,
            boxShadow: shadows.medium,
            zIndex: 100,
            padding: spacing.xs,
          }}>
            {username && (
              <div style={{
                padding: `${spacing.sm} ${spacing.md}`,
                borderBottom: `1px solid ${colors.border.default}`,
                marginBottom: spacing.xs,
              }}>
                <div style={{
                  fontSize: typography.fontSize.body,
                  fontWeight: typography.fontWeight.semiBold,
                  color: colors.text.primary,
                }}>
                  {username}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout?.();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: `${spacing.sm} ${spacing.md}`,
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontSize: typography.fontSize.body,
                color: colors.text.secondary,
                cursor: 'pointer',
                borderRadius: radii.sm,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Need to import shadows and radii
import { shadows } from '../../design-tokens';

export default TopBar;
