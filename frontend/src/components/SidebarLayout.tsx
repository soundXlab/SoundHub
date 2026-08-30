import * as React from "react";
import { SidebarNav } from "./SidebarNav";
import { colors, spacing, radii, typography } from "../design-tokens";

interface SidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarLayout = ({ children, className = "" }: SidebarLayoutProps) => {
  const [collapsed, setCollapsed] = React.useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    localStorage.setItem("sidebarCollapsed", String(!collapsed));
  };

  return (
    <div className={`sidebar-layout ${className}`} style={{
      display: 'flex',
      minHeight: '100vh',
      background: colors.bg.primary,
    }}>
      <aside className={`sidebar-layout-sidebar ${collapsed ? "sidebar-layout-sidebar-collapsed" : ""}`} style={{
        width: collapsed ? 44 : 200,
        background: colors.bg.surface,
        borderRight: `1px solid ${colors.border.default}`,
        transition: 'width 0.15s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div className="sidebar-layout-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? spacing.xs : `${spacing.xs} ${spacing.sm}`,
          borderBottom: `1px solid ${colors.border.default}`,
          height: '36px',
          boxSizing: 'border-box',
          background: colors.bg.toolbar,
        }}>
          <button onClick={toggleCollapse} className="sidebar-layout-toggle" style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: colors.text.muted,
            fontSize: typography.fontSize.tiny,
            padding: spacing.xs,
            lineHeight: 1,
          }}>
            {collapsed ? "‹" : "›"}
          </button>
          {!collapsed && (
            <div className="sidebar-layout-brand">
              <span className="sidebar-layout-brand-text" style={{
                fontWeight: 700,
                fontSize: typography.fontSize.h3,
                color: colors.brand.primary,
                letterSpacing: '-0.3px',
              }}>SoundHub</span>
            </div>
          )}
        </div>
        <nav className="sidebar-layout-nav" style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing.xs,
        }}>
          <SidebarNav collapsed={collapsed} />
        </nav>
      </aside>
      <main className="sidebar-layout-content" style={{
        flex: 1,
        overflow: 'auto',
        padding: `${spacing.lg} ${spacing['2xl']}`,
      }}>{children}</main>
    </div>
  );
};