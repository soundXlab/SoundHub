import type { Meta, StoryObj } from '@storybook/react';
import AssetCard from './AssetCard';

// Mock data for the asset
const mockAsset: any = {
  listing_id: 1,
  name: 'Sample Asset',
  bpm: [120, 120],
  key: 'C',
  genres: ['Electronic', 'Ambient'],
  price_snd: '1000000000000000000', // 1 SND in wei
  license: 'standard',
  waveform: [0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.4, -0.3, -0.2, -0.1],
  duration_seconds: 30,
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