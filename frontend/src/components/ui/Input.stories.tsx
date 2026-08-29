import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    // no variants
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    value: '',
    // onChange handled by storybook
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Enter text...',
    value: '',
    error: 'This field is required',
  },
};