import React from 'react';
import { colors, spacing, layout, typography } from '../../design-tokens';

export interface AppLayoutProps {
  sidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  sidebar,
  rightSidebar,
  topbar,
  children,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: colors.bg.primary,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.body,
    }}>
      {/* TopBar — thin DaVinci toolbar */}
      {topbar && (
        <div style={{ zIndex: 100 }}>
          {topbar}
        </div>
      )}

      {/* Main content area with sidebar */}
      <div style={{
        display: 'flex',
        flex: 1,
      }}>
        {/* Sidebar — dark panel */}
        {sidebar && (
          <aside style={{
            width: sidebarCollapsed ? layout.sidebar.collapsedWidth : layout.sidebar.width,
            background: colors.bg.surface,
            borderRight: `1px solid ${colors.border.default}`,
            transition: 'width 0.15s ease',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: spacing.xl,
        }}>
          {children}
        </main>

        {/* Right Sidebar — Inspector panel */}
        {rightSidebar && (
          <aside style={{
            width: layout.inspector.width,
            background: colors.bg.surface,
            borderLeft: `1px solid ${colors.border.default}`,
            overflow: 'auto',
            flexShrink: 0,
          }}>
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
};

// Sidebar wrapper component
export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggle,
  children,
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Sidebar header — compact */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? spacing.sm : `${spacing.sm} ${spacing.md}`,
        borderBottom: `1px solid ${colors.border.default}`,
        height: layout.topbar.height,
        boxSizing: 'border-box',
        background: colors.bg.toolbar,
      }}>
        {!collapsed && (
          <span style={{
            fontWeight: typography.fontWeight.bold,
            fontSize: typography.fontSize.h3,
            color: colors.brand.primary,
            letterSpacing: '-0.3px',
          }}>
            SoundHub
          </span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.text.muted,
              fontSize: '10px',
              padding: spacing.xs,
              borderRadius: radii.sm,
              lineHeight: 1,
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        )}
      </div>

      {/* Sidebar navigation */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: spacing.sm,
      }}>
        {children}
      </nav>
    </div>
  );
};

// Sidebar navigation item — DaVinci style
export interface SidebarNavItemProps {
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  collapsed?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  href,
  icon,
  active = false,
  collapsed = false,
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
        gap: spacing.md,
        padding: collapsed ? `${spacing.xs} ${spacing.sm}` : `${spacing.xs} ${spacing.md}`,
        marginBottom: '1px',
        borderRadius: radii.sm,
        textDecoration: 'none',
        fontSize: '15px',
        fontWeight: typography.fontWeight.medium,
        color: active ? colors.text.primary : colors.text.secondary,
        background: active ? colors.bg.hover : 'transparent',
        transition: 'all 0.1s ease',
        justifyContent: collapsed ? 'center' : 'flex-start',
        lineHeight: 1.4,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = colors.bg.hover;
          e.currentTarget.style.color = colors.text.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.text.secondary;
        }
      }}
    >
      {icon && (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          flexShrink: 0,
        }}>
          {icon}
        </span>
      )}
      {!collapsed && <span>{children}</span>}
    </a>
  );
};

// Sidebar section divider
export const SidebarDivider: React.FC = () => (
  <div style={{
    height: '1px',
    background: colors.border.default,
    margin: `${spacing.sm} ${spacing.md}`,
  }} />
);

// Sidebar section header
export interface SidebarSectionProps {
  title: string;
  collapsed?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  collapsed = false,
}) => {
  if (collapsed) return null;

  return (
    <div style={{
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.tiny,
      fontWeight: typography.fontWeight.bold,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: colors.text.muted,
    }}>
      {title}
    </div>
  );
};

// Need to import radii
import { radii } from '../../design-tokens';

export default AppLayout;
