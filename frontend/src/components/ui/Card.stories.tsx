import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { ThemeProvider } from '../../theme/themeContext';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: { options: ['default', 'elevated', 'interactive'] },
    padding: { options: ['none', 'sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the content of the card.</p>
        </CardContent>
        <CardFooter>
          <button className="btn">Action</button>
        </CardFooter>
      </>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    children: (
      <>
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card has elevated style.</p>
        </CardContent>
        <CardFooter>
          <button className="btn">Action</button>
        </CardFooter>
      </>
    ),
  },
};

export const Interactive: Story = {
  args: {
    variant: 'interactive',
    padding: 'md',
    onClick: () => alert('Card clicked!'),
    children: (
      <>
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card responds to clicks and hover.</p>
        </CardContent>
        <CardFooter>
          <button className="btn">Action</button>
        </CardFooter>
      </>
    ),
  },
};

export const PaddingNone: Story = {
  args: {
    variant: 'default',
    padding: 'none',
    children: (
      <>
        <CardHeader>
          <CardTitle>No Padding</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card has no padding.</p>
        </CardContent>
      </>
    ),
  },
};

export const PaddingSM: Story = {
  args: {
    variant: 'default',
    padding: 'sm',
    children: (
      <>
        <CardHeader>
          <CardTitle>Small Padding</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card has small padding.</p>
        </CardContent>
      </>
    ),
  },
};

export const PaddingLG: Story = {
  args: {
    variant: 'default',
    padding: 'lg',
    children: (
      <>
        <CardHeader>
          <CardTitle>Large Padding</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card has large padding.</p>
        </CardContent>
      </>
    ),
  },
};

export const LightTheme: Story = {
  render: (args: any) => (
    <ThemeProvider>
      <Card {...args} />
    </ThemeProvider>
  ),
  args: {
    variant: 'default',
    padding: 'md',
    children: (
      <>
        <CardHeader>
          <CardTitle>Themed Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card adapts to the theme.</p>
        </CardContent>
        <CardFooter>
          <button className="btn">Action</button>
        </CardFooter>
      </>
    ),
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const DarkTheme: Story = {
  render: (args: any) => (
    <ThemeProvider>
      <Card {...args} />
    </ThemeProvider>
  ),
  args: {
    variant: 'default',
    padding: 'md',
    children: (
      <>
        <CardHeader>
          <CardTitle>Themed Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card adapts to the theme.</p>
        </CardContent>
        <CardFooter>
          <button className="btn">Action</button>
        </CardFooter>
      </>
    ),
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};