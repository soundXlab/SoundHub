import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: { options: ['default', 'secondary', 'ghost', 'ready', 'processing', 'error', 'archived', 'warning', 'info', 'tip'] },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'secondary',
    children: 'Badge',
  },
};

export const Ready: Story = {
  args: {
    variant: 'ready',
    children: 'Ready',
  },
};

export const Processing: Story = {
  args: {
    variant: 'processing',
    children: 'Processing',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error',
  },
};

export const Info: Story = {
  args: {
    variant: 'secondary',
    children: 'Info',
  },
};

export const Warning: Story = {
  args: {
    variant: 'draft',
    children: 'Warning',
  },
};

export const Tip: Story = {
  args: {
    variant: 'ghost',
    children: 'Tip',
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