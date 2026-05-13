import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { Combobox_WIP } from '../Combobox';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
  { value: 'd', label: 'Option D' },
];

const meta: Meta<typeof Combobox_WIP> = {
  title: 'Core/Combobox (WIP)',
  component: Combobox_WIP,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <TestWrapper>
          <div style={{ padding: '16px', maxWidth: '300px' }}>
            <Story />
          </div>
        </TestWrapper>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Combobox_WIP>;

export const SingleSelect: Story = {
  args: { label: 'Select an option', options, placeholder: 'Choose...' },
};

export const WithValue: Story = {
  args: { label: 'With value', options, value: 'b' },
};

export const MultiSelect: Story = {
  args: {
    label: 'Select multiple',
    options,
    multiselect: true,
    value: [],
    placeholder: 'Choose options...',
  },
};

export const MultiSelectWithValues: Story = {
  args: {
    label: 'Multi with selections',
    options,
    multiselect: true,
    value: ['a', 'c'],
  },
};

export const WithError: Story = {
  args: {
    label: 'Error state',
    options,
    error: true,
    helperText: 'This field is required',
  },
};

export const Disabled: Story = {
  args: { label: 'Disabled', options, disabled: true, value: 'a' },
};

export const Required: Story = {
  args: {
    label: 'Required field',
    options,
    required: true,
    placeholder: 'Choose...',
  },
};
