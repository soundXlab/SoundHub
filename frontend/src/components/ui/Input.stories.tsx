import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { ThemeProvider } from '../../theme/themeContext';

// Mock icons (simple divs)
const mockLeftIcon = (
  <div style={{ width: 12, height: 12, background: '#E85D2A', borderRadius: 2 }} />
);
const mockRightIcon = (
  <div style={{ width: 12, height: 12, background: '#4A9EE5', borderRadius: 2 }} />
);

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    leftIcon: { control: false },
    rightIcon: { control: false },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    value: '',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    value: '',
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    placeholder: '••••••••',
    value: '',
    error: 'This field is required',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Age',
    placeholder: 'Enter your age',
    value: '',
    helperText: 'Must be 18 or older',
  },
};

export const WithIcons: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search assets...',
    value: '',
    leftIcon: mockLeftIcon,
    rightIcon: mockRightIcon,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'You cannot edit me',
    value: 'Disabled value',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Read Only Input',
    placeholder: 'You can select but not edit',
    value: 'Read only value',
    readOnly: true,
  },
};

export const LightTheme: Story = {
  render: (args) => (
    <ThemeProvider>
      <Input {...args} />
    </ThemeProvider>
  ),
  args: {
    label: 'Themed Input',
    placeholder: 'Enter text...',
    value: '',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const DarkTheme: Story = {
  render: (args) => (
    <ThemeProvider>
      <Input {...args} />
    </ThemeProvider>
  ),
  args: {
    label: 'Themed Input',
    placeholder: 'Enter text...',
    value: '',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};