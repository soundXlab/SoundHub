import type { Meta, StoryObj } from '@storybook/react-vite';
import { SidebarLayout } from './SidebarLayout';
import { ThemeProvider } from '../theme/themeContext';
import { MemoryRouter } from 'react-router-dom';

// Mock content for the main area
const mockContent = (
  <div style={{ padding: '20px', background: '#232323', borderRadius: '4px' }}>
    <h1>Main Content</h1>
    <p>This is the main content area of the SidebarLayout.</p>
  </div>
);

const meta: Meta<typeof SidebarLayout> = {
  title: 'Components/SidebarLayout',
  component: SidebarLayout,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof SidebarLayout>;

export const Default: Story = {
  render: (args: any) => (
    <ThemeProvider>
      <MemoryRouter>
        <SidebarLayout {...args}>{mockContent}</SidebarLayout>
      </MemoryRouter>
    </ThemeProvider>
  ),
  args: {
    // We want to control the collapsed state for the story.
    // However, SidebarLayout reads from localStorage. We can't override via props.
    // We'll create two stories: one that forces expanded (by clearing localStorage in preview? not possible)
    // Instead, we'll rely on the default state (which is from localStorage) and note that in Storybook we can't control it.
    // Alternatively, we can modify the component to accept a collapsed prop? But we are not supposed to change the component.
    // The task says: "Не придумывай API, props, импорты или пути: сверяйся с кодом."
    // So we cannot add a prop. We'll have to accept the current state from localStorage.
    // To have consistent stories, we can clear localStorage before each story? Not possible in Storybook.
    // We'll note that the collapsed state is controlled by localStorage and in Storybook it will be whatever was last set.
    // For demonstration, we'll show both states by having two stories and manually setting localStorage in the browser? Not ideal.
    // We'll instead create a wrapper that overrides the localStorage getItem in the story? We can do that by mocking in the story.
    // Since we are in a Storybook context, we can override the getter in the render function.
    // We'll do that for the stories that need a specific state.
    className: '',
  },
};

export const Expanded: Story = {
  render: (args: any) => {
    // Override localStorage.getItem to return null (so collapsed = false)
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key) => (key === 'sidebarCollapsed' ? null : originalGetItem.call(localStorage, key));
    const result = (
      <ThemeProvider>
        <MemoryRouter>
          <SidebarLayout {...args}>{mockContent}</SidebarLayout>
        </MemoryRouter>
      </ThemeProvider>
    );
    // Restore
    localStorage.getItem = originalGetItem;
    return result;
  },
  args: {
    className: '',
  },
};

export const Collapsed: Story = {
  render: (args: any) => {
    // Override localStorage.getItem to return 'true'
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key) => (key === 'sidebarCollapsed' ? 'true' : originalGetItem.call(localStorage, key));
    const result = (
      <ThemeProvider>
        <MemoryRouter>
          <SidebarLayout {...args}>{mockContent}</SidebarLayout>
        </MemoryRouter>
      </ThemeProvider>
    );
    // Restore
    localStorage.getItem = originalGetItem;
    return result;
  },
  args: {
    className: '',
  },
};

export const LightTheme: Story = {
  render: (args: any) => {
    // Override to expanded for consistency
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key) => (key === 'sidebarCollapsed' ? null : originalGetItem.call(localStorage, key));
    const result = (
      <ThemeProvider>
        <MemoryRouter>
          <SidebarLayout {...args}>{mockContent}</SidebarLayout>
        </MemoryRouter>
      </ThemeProvider>
    );
    localStorage.getItem = originalGetItem;
    return result;
  },
  args: {
    className: '',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const DarkTheme: Story = {
  render: (args: any) => {
    // Override to expanded for consistency
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key) => (key === 'sidebarCollapsed' ? null : originalGetItem.call(localStorage, key));
    const result = (
      <ThemeProvider>
        <MemoryRouter>
          <SidebarLayout {...args}>{mockContent}</SidebarLayout>
        </MemoryRouter>
      </ThemeProvider>
    );
    localStorage.getItem = originalGetItem;
    return result;
  },
  args: {
    className: '',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};