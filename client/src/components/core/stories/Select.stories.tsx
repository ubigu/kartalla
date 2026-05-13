import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from '../Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

const meta: Meta<typeof Select> = {
  title: 'Core/Select',
  component: Select,
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
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: { label: 'Select', options, placeholder: 'Choose an option...' },
};

export const WithValue: Story = {
  args: { label: 'Select', options, value: 'b' },
};

export const WithHelperText: Story = {
  args: { label: 'Select', options, helperText: 'Pick one from the list' },
};

export const Error: Story = {
  args: {
    label: 'Select',
    options,
    error: true,
    helperText: 'This field is required',
  },
};

export const Disabled: Story = {
  args: { label: 'Select', options, disabled: true, value: 'a' },
};

export const Required: Story = {
  args: {
    label: 'Required',
    options,
    required: true,
    placeholder: 'Choose...',
  },
};
