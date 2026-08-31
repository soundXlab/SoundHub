import type { Meta, StoryObj } from '@storybook/react-vite';
import TopBar, { TopBarLink, TopBarSearch, TopBarUserMenu } from './TopBar';
import { ThemeProvider } from '../../theme/themeContext';
import { MemoryRouter } from 'react-router-dom';

// Mock data
const mockLogo = (
  <div style={{ width: 30, height: 30, background: '#E85D2A', borderRadius: 4 }} />
);
const mockActions = (
  <>
    <button style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #616161', color: '#E85D2A', borderRadius: 3 }}>
      Action
    </button>
  </>
);

const meta: Meta<typeof TopBar> = {
  title: 'Components/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  argTypes: {
    sticky: { control: 'boolean' },
    logo: { control: false },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: {
    logo: mockLogo,
    title: 'SoundHub',
    children: (
      <MemoryRouter>
        <>
          <TopBarLink href="/dashboard">Dashboard</TopBarLink>
          <TopBarLink href="/projects">Projects</TopBarLink>
          <TopBarLink href="/marketplace">Marketplace</TopBarLink>
        </>
      </MemoryRouter>
    ),
    actions: mockActions,
    sticky: true,
  },
};

export const NotAuthenticated: Story = {
  args: {
    logo: mockLogo,
    title: 'SoundHub',
    children: (
      <MemoryRouter>
        <>
          <TopBarLink href="/login">Login</TopBarLink>
          <TopBarLink href="/register">Register</TopBarLink>
        </>
      </MemoryRouter>
    ),
    actions: mockActions,
    sticky: true,
  },
};

export const WithSearch: Story = {
  args: {
    logo: mockLogo,
    title: 'SoundHub',
    children: (
      <MemoryRouter>
        <>
          <TopBarLink href="/dashboard">Dashboard</TopBarLink>
          <TopBarSearch placeholder="Search assets..." />
        </>
      </MemoryRouter>
    ),
    actions: mockActions,
    sticky: true,
  },
};

export const AuthenticatedUser: Story = {
  args: {
    logo: mockLogo,
    title: 'SoundHub',
    children: (
      <MemoryRouter>
        <>
          <TopBarLink href="/dashboard">Dashboard</TopBarLink>
          <TopBarLink href="/projects">Projects</TopBarLink>
        </>
      </MemoryRouter>
    ),
    actions: (
      <>
        <TopBarUserMenu
          username="jdoe"
          avatar="https://i.pravatar.cc/40?img=3"
          notifications={5}
          onLogout={() => console.log('Logout clicked')}
        />
      </>
    ),
    sticky: true,
  },
};

export const LightTheme: Story = {
  render: (args: any) => (
    <ThemeProvider>
      <TopBar {...args} />
    </ThemeProvider>
  ),
  args: {
    logo: mockLogo,
    title: 'SoundHub',
    children: (
      <MemoryRouter>
        <TopBarLink href="/dashboard">Dashboard</TopBarLink>
      </MemoryRouter>
    ),
    actions: mockActions,
    sticky: true,
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const DarkTheme: Story = {
  render: (args: any) => (
    <ThemeProvider>
      <TopBar {...args} />
    </ThemeProvider>
  ),
  args: {
    logo: mockLogo,
    title: 'SoundHub',
    children: (
      <MemoryRouter>
        <TopBarLink href="/dashboard">Dashboard</TopBarLink>
      </MemoryRouter>
    ),
    actions: mockActions,
    sticky: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};