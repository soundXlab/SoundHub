import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { ThemeProvider } from '../../theme/themeContext';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: { options: ['draft', 'processing', 'ready', 'error', 'archived', 'secondary', 'ghost'] },
    size: { options: ['sm', 'md'] },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'draft',
    children: 'Default',
  },
};

export const Draft: Story = {
  args: {
    variant: 'draft',
    children: 'Draft',
  },
};

export const Processing: Story = {
  args: {
    variant: 'processing',
    children: 'Processing',
  },
};

export const Ready: Story = {
  args: {
    variant: 'ready',
    children: 'Ready',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error',
  },
};

export const Archived: Story = {
  args: {
    variant: 'archived',
    children: 'Archived',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

export const SizeSM: Story = {
  args: {
    variant: 'secondary',
    size: 'sm',
    children: 'Small',
  },
};

export const SizeMD: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Medium',
  },
};

export const LightTheme: Story = {
  render: (args) => (
    <ThemeProvider>
      <Badge {...args} />
    </ThemeProvider>
  ),
  args: {
    variant: 'secondary',
    children: 'Themed Badge',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const DarkTheme: Story = {
  render: (args) => (
    <ThemeProvider>
      <Badge {...args} />
    </ThemeProvider>
  ),
  args: {
    variant: 'secondary',
    children: 'Themed Badge',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};