import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Core/Checkbox',
  component: Checkbox,
  decorators: [
    (Story) => (
      <TestWrapper>
        <Story />
      </TestWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { checked: true, readOnly: true },
};

export const WithLabel: Story = {
  args: { label: 'Accept terms and conditions' },
};

export const CheckedWithLabel: Story = {
  args: { label: 'Accepted', checked: true, readOnly: true },
};

export const Disabled: Story = {
  args: { label: 'Disabled option', disabled: true },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true,
    readOnly: true,
  },
};
