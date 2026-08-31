import type { Meta, StoryObj } from '@storybook/react-vite';
import Waveform from './Waveform';
import { ThemeProvider } from '../theme/themeContext';

// Mock data for waveform
const mockPeaks: number[] = [0.1, 0.3, 0.5, 0.4, 0.6, 0.8, 0.6, 0.4, 0.2, 0.1, 0.0, -0.1, -0.3, -0.5, -0.4, -0.6, -0.8, -0.6, -0.4, -0.2];
const emptyPeaks: number[] = [];

const meta: Meta<typeof Waveform> = {
  title: 'Components/Waveform',
  component: Waveform,
  tags: ['autodocs'],
  argTypes: {
    playing: { control: 'boolean' },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
};

export default meta;
type Story = StoryObj<typeof Waveform>;

export const Normal: Story = {
  args: {
    peaks: mockPeaks,
    progress: 0,
    playing: false,
  },
};

export const Playing: Story = {
  args: {
    peaks: mockPeaks,
    progress: 0.5,
    playing: true,
  },
};

export const Empty: Story = {
  args: {
    peaks: emptyPeaks,
    progress: 0,
    playing: false,
  },
};

export const LightTheme: Story = {
  render: (args: any) => (
    <ThemeProvider>
      <Waveform {...args} />
    </ThemeProvider>
  ),
  args: {
    peaks: mockPeaks,
    progress: 0.3,
    playing: false,
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const DarkTheme: Story = {
  render: (args: any) => (
    <ThemeProvider>
      <Waveform {...args} />
    </ThemeProvider>
  ),
  args: {
    peaks: mockPeaks,
    progress: 0.7,
    playing: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};