import { Button } from '@mui/material';
import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Button> = {
  title: 'Core/Button',
  component: Button,
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
      options: ['contained', 'outlined', 'text'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Contained: Story = {
  args: { variant: 'contained', children: 'Seuraava' },
};

export const Outlined: Story = {
  args: { variant: 'outlined', children: 'Edellinen' },
};

export const Text: Story = {
  args: { variant: 'text', children: 'Cancel' },
};

export const Disabled: Story = {
  args: { variant: 'contained', children: 'Disabled', disabled: true },
};
