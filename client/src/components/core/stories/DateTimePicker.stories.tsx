import { TestWrapper } from '@src/test/TestWrapper';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTimePicker } from '../DateTimePicker';

const meta: Meta<typeof DateTimePicker> = {
  title: 'Core/DateTimePicker',
  component: DateTimePicker,
  decorators: [
    (Story) => (
      <TestWrapper>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <div style={{ padding: '16px', maxWidth: '300px' }}>
            <Story />
          </div>
        </LocalizationProvider>
      </TestWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DateTimePicker>;

export const Default: Story = {
  args: { label: 'Label' },
};

export const WithValue: Story = {
  args: { label: 'Label', value: new Date('2025-06-15T10:30:00') },
};

export const WithHelperText: Story = {
  args: { label: 'Label', helperText: 'Select a date and time' },
};

export const Error: Story = {
  args: { label: 'Label', error: true, helperText: 'Date is required' },
};

export const Required: Story = {
  args: { label: 'Required field', required: true },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    disabled: true,
    value: new Date('2025-06-15T10:30:00'),
  },
};

export const NoLabel: Story = {
  args: {},
};
