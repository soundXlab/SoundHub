import type { Meta, StoryObj } from '@storybook/react-vite';
import AssetCard from './AssetCard';

// Mock data for the asset
const mockAsset: any = {
  listing_id: 1,
  name: 'Serum — Dark Bass Pack',
  bpm: [120, 140],
  key: 'Am',
  genres: ['Bass', 'Electronic', 'Trap'],
  price_snd: '1000000000000000000', // 1 SND in wei
  license: 1, // 1 for FREE, 2 for PAID, etc.
  waveform: [0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.4, -0.3, -0.2, -0.1],
  duration_seconds: 30,
  rating: 4.9,
};

const mockOnTogglePlay = (asset: any) => {
  console.log('Toggle play', asset);
};

const mockOnAssetDetail = (asset: any) => {
  console.log('Asset detail', asset);
};

const meta: Meta<typeof AssetCard> = {
  title: 'Pages/AssetCard',
  component: AssetCard,
  tags: ['autodocs'],
  argTypes: {
    view: { options: ['grid', 'list'] },
    isPlaying: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AssetCard>;

export const Grid: Story = {
  args: {
    asset: mockAsset,
    isPlaying: false,
    onTogglePlay: mockOnTogglePlay,
    onAssetDetail: mockOnAssetDetail,
    view: 'grid',
  },
};

export const List: Story = {
  args: {
    asset: mockAsset,
    isPlaying: true,
    onTogglePlay: mockOnTogglePlay,
    onAssetDetail: mockOnAssetDetail,
    view: 'list',
  },
};

export const Playing: Story = {
  args: {
    asset: mockAsset,
    isPlaying: true,
    onTogglePlay: mockOnTogglePlay,
    onAssetDetail: mockOnAssetDetail,
    view: 'grid',
  },
};

export const Free: Story = {
  args: {
    asset: {
      ...mockAsset,
      name: 'Vital — Ambient Pads',
      license: 1, // FREE
      price_snd: '0',
      rating: 4.8,
    },
    isPlaying: false,
    onTogglePlay: mockOnTogglePlay,
    onAssetDetail: mockOnAssetDetail,
    view: 'grid',
  },
};

export const Paid: Story = {
  args: {
    asset: {
      ...mockAsset,
      name: 'Rhodes Dream Keys',
      license: 2, // PAID
      price_snd: '1500000000000000000', // 1.5 SND
      rating: 4.6,
    },
    isPlaying: false,
    onTogglePlay: mockOnTogglePlay,
    onAssetDetail: mockOnAssetDetail,
    view: 'grid',
  },
};