import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from '../Chip';

const meta: Meta<typeof Chip> = {
  title: 'Core/Chip',
  component: Chip,
  decorators: [
    (Story) => (
      <TestWrapper>
        <Story />
      </TestWrapper>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'outlined'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: { label: 'Chip' },
};

export const Outlined: Story = {
  args: { label: 'Outlined', variant: 'outlined' },
};

export const Clickable: Story = {
  args: { label: 'Clickable', onClick: () => {} },
};

export const Deletable: Story = {
  args: { label: 'Deletable', onDelete: () => {} },
};

export const Disabled: Story = {
  args: { label: 'Disabled', onClick: () => {}, disabled: true },
};
