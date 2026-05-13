import { TestWrapper } from '@src/test/TestWrapper';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tab, Tabs } from '../Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Core/Tabs',
  component: Tabs,
  decorators: [
    (Story) => (
      <TestWrapper>
        <Story />
      </TestWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(0);
    return (
      <Tabs value={value} onChange={setValue}>
        <Tab label="Perustiedot" value={0} />
        <Tab label="Sivut" value={1} />
        <Tab label="Asetukset" value={2} />
      </Tabs>
    );
  },
};

export const SecondTabActive: Story = {
  render: () => {
    const [value, setValue] = useState(1);
    return (
      <Tabs value={value} onChange={setValue}>
        <Tab label="Perustiedot" value={0} />
        <Tab label="Sivut" value={1} />
        <Tab label="Asetukset" value={2} />
      </Tabs>
    );
  },
};

export const ManyTabs: Story = {
  render: () => {
    const [value, setValue] = useState(0);
    return (
      <Tabs value={value} onChange={setValue}>
        <Tab label="Tab 1" value={0} />
        <Tab label="Tab 2" value={1} />
        <Tab label="Tab 3" value={2} />
        <Tab label="Tab 4" value={3} />
        <Tab label="Tab 5" value={4} />
      </Tabs>
    );
  },
};
