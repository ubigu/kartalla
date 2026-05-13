import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../Input';

const meta: Meta<typeof Input> = {
  title: 'Core/Input',
  component: Input,
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
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { label: 'Label', placeholder: 'Placeholder text' },
};

export const WithValue: Story = {
  args: { label: 'Label', defaultValue: 'Some input value' },
};

export const WithHelperText: Story = {
  args: { label: 'Label', helperText: 'Helpful hint below the field' },
};

export const Error: Story = {
  args: { label: 'Label', error: true, helperText: 'This field is required' },
};

export const Disabled: Story = {
  args: { label: 'Label', disabled: true, defaultValue: 'Cannot edit this' },
};

export const Required: Story = {
  args: { label: 'Required field', required: true, placeholder: 'Enter value' },
};

export const NoLabel: Story = {
  args: { placeholder: 'No label input' },
};
