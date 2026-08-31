import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import {
  AppLayout,
  Sidebar,
  SidebarNavItem,
  SidebarDivider,
  SidebarSection,
  TopBar,
  TopBarLink,
  TopBarSearch,
  TopBarUserMenu,
  Button,
  colors,
  typography,
  spacing,
} from './ui';
import {
  Home,
  Folder,
  Music,
  Upload,
  Settings,
  BarChart2,
  Search,
  Bell,
  Wifi,
  WifiOff,
  MessageSquare,
  Calendar,
  LogOut,
} from 'lucide-react';

interface FullPageLayoutProps {
  children: React.ReactNode;
  /** Override the active sidebar item (defaults to current pathname) */
  activeSection?: string;
}

const ConnectionIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 6px',
      borderRadius: '3px',
      background: isOnline ? colors.success + '15' : colors.error + '15',
      color: isOnline ? colors.success : colors.error,
      fontSize: '15px',
      fontWeight: 600,
    }}>
      {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
};

export const FullPageLayout: React.FC<FullPageLayoutProps> = ({
  children,
  activeSection,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);
  const location = useLocation();
  const pathname = activeSection || location.pathname;

  useEffect(() => {
    api.me().then(u => setUser(u)).catch(() => {});
    api.listSessions().then(s => {
      const open = s.filter((sess: any) => sess.rounds_open).length;
      setNotifCount(open);
    }).catch(() => {});
  }, []);

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <AppLayout
      sidebarCollapsed={sidebarCollapsed}
      topbar={
        <TopBar
          title="SoundHub"
          logo={<span style={{ color: colors.brand.primary, fontSize: '20px' }}>🎵</span>}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <ConnectionIndicator />
              <TopBarSearch
                placeholder="Search projects... (⌘K)"
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <div style={{ position: 'relative' }}>
                <Button variant="ghost" size="sm">
                  <Bell size={12} />
                </Button>
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: colors.error, color: '#fff', fontSize: '10px',
                    fontWeight: 700, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', lineHeight: 1,
                  }}>{notifCount}</span>
                )}
              </div>
              <TopBarUserMenu username={user?.username || 'Producer'} />
            </div>
          }
        >
          <TopBarLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</TopBarLink>
          <TopBarLink href="/projects" active={pathname.startsWith('/projects')}>Projects</TopBarLink>
          <TopBarLink href="/marketplace" active={pathname === '/marketplace'}>Marketplace</TopBarLink>
          <TopBarLink href="/reviews" active={pathname === '/reviews'}>Reviews</TopBarLink>
        </TopBar>
      }
      sidebar={
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <SidebarSection title="Main" collapsed={sidebarCollapsed} />
          <SidebarNavItem href="/dashboard" icon={<Home size={18} />} active={pathname === '/dashboard'} collapsed={sidebarCollapsed}>
            Dashboard
          </SidebarNavItem>
          <SidebarNavItem href="/projects" icon={<Folder size={18} />} active={pathname.startsWith('/projects')} collapsed={sidebarCollapsed}>
            Projects
          </SidebarNavItem>
          <SidebarNavItem href="/marketplace" icon={<Music size={18} />} active={pathname === '/marketplace'} collapsed={sidebarCollapsed}>
            Marketplace
          </SidebarNavItem>
          <SidebarNavItem href="/reviews" icon={<MessageSquare size={18} />} active={pathname === '/reviews'} collapsed={sidebarCollapsed}>
            Reviews
          </SidebarNavItem>
          <SidebarNavItem href="/upload" icon={<Upload size={14} />} active={pathname === '/upload'} collapsed={sidebarCollapsed}>
            Upload
          </SidebarNavItem>

          <SidebarDivider />

          <SidebarSection title="Tools" collapsed={sidebarCollapsed} />
          <SidebarNavItem href="/analytics" icon={<BarChart2 size={14} />} active={pathname === '/analytics'} collapsed={sidebarCollapsed}>
            Analytics
          </SidebarNavItem>
          <SidebarNavItem href="/calendar" icon={<Calendar size={14} />} active={pathname === '/calendar'} collapsed={sidebarCollapsed}>
            Calendar
          </SidebarNavItem>

          <SidebarDivider />

          <SidebarSection title="Account" collapsed={sidebarCollapsed} />
          <SidebarNavItem href="/settings" icon={<Settings size={14} />} active={pathname === '/settings'} collapsed={sidebarCollapsed}>
            Settings
          </SidebarNavItem>

          {/* User profile at bottom */}
          {!sidebarCollapsed && user && (
            <div style={{
              marginTop: 'auto', paddingTop: '12px',
              borderTop: `1px solid ${colors.border.default}`,
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 8px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: `${colors.brand.primary}20`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: colors.brand.primary,
                flexShrink: 0,
              }}>
                {user.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{user.username}
                </div>
                <div style={{ fontSize: '11px', color: colors.text.muted }}>
                  {user.specialty || 'Producer'}
                </div>
              </div>
            </div>
          )}
        </Sidebar>
      }
    >
      {children}
    </AppLayout>
  );
};

export default FullPageLayout;
