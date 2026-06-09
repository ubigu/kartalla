import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioButton } from '../RadioButton';

const meta: Meta<typeof RadioButton> = {
  title: 'Core/RadioButton',
  component: RadioButton,
  decorators: [
    (Story) => (
      <TestWrapper>
        <div style={{ padding: '16px', maxWidth: '300px' }}>
          <Story />
        </div>
      </TestWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RadioButton>;

export const Unchecked: Story = {
  args: { label: 'Option A' },
};

export const Checked: Story = {
  args: { label: 'Option A', checked: true, readOnly: true },
};

export const Required: Story = {
  args: { label: 'Required option', required: true },
};

export const WithHelperText: Story = {
  args: { label: 'Option A', helperText: 'Helpful hint below the field' },
};

export const Error: Story = {
  args: {
    label: 'Option A',
    error: true,
    helperText: 'This field is required',
  },
};

export const Disabled: Story = {
  args: { label: 'Option A', disabled: true },
};

export const DisabledChecked: Story = {
  args: { label: 'Option A', disabled: true, checked: true, readOnly: true },
};

export const NoLabel: Story = {
  args: { 'aria-label': 'Option A' },
};
