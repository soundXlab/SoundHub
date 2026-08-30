// SoundHub UI Kit
// Design system components based on the Figma brief

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type { CardProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { AudioPlayer } from './AudioPlayer';
export type { AudioPlayerProps } from './AudioPlayer';

export { TopBar, TopBarLink, TopBarSearch, TopBarUserMenu } from './TopBar';
export type { TopBarProps, TopBarLinkProps, TopBarSearchProps, TopBarUserMenuProps } from './TopBar';

export { 
  AppLayout, 
  Sidebar, 
  SidebarNavItem, 
  SidebarDivider, 
  SidebarSection 
} from './AppLayout';
export type { 
  AppLayoutProps, 
  SidebarProps, 
  SidebarNavItemProps, 
  SidebarSectionProps 
} from './AppLayout';

export {
  RightSidebar,
  RightSidebarSection,
  TipCard,
  KeyboardShortcut,
  StatItem,
  QuickAction,
  VibyAIChat
} from './RightSidebar';
export type {
  RightSidebarProps,
  RightSidebarSectionProps,
  TipCardProps,
  KeyboardShortcutProps,
  StatItemProps,
  QuickActionProps,
  VibyAIChatProps
} from './RightSidebar';

// Re-export design tokens
export * from '../../design-tokens';
