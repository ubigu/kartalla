import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputHelperText } from '../InputHelperText';

const meta: Meta<typeof InputHelperText> = {
  title: 'Core/InputHelperText',
  component: InputHelperText,
  decorators: [
    (Story) => (
      <TestWrapper>
        <Story />
      </TestWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InputHelperText>;

export const Default: Story = {
  args: { children: 'Helpful hint for the field above' },
};

export const Error: Story = {
  args: { children: 'This field is required', isError: true },
};
