import { Tab, Tabs } from '@mui/material';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { CoreTab, CoreTabs } from './Tabs';

describe('MUI Tabs', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <Tabs value={0}>
          <Tab label="First" />
          <Tab label="Second" />
          <Tab label="Third" />
        </Tabs>
      </TestWrapper>,
    );
    const { violations } = await axe.run(container);
    expect(violations).toEqual([]);
  });

  it('after tab change has no accessibility violations', async () => {
    const user = userEvent.setup();
    let value = 0;
    const { container, rerender } = render(
      <TestWrapper>
        <Tabs
          value={value}
          onChange={(_, v) => {
            value = v;
          }}
        >
          <Tab label="First" />
          <Tab label="Second" />
        </Tabs>
      </TestWrapper>,
    );
    await user.click(container.querySelectorAll('[role="tab"]')[1]);
    rerender(
      <TestWrapper>
        <Tabs value={value} onChange={() => {}}>
          <Tab label="First" />
          <Tab label="Second" />
        </Tabs>
      </TestWrapper>,
    );
    const { violations } = await axe.run(container);
    expect(violations).toEqual([]);
  });
});

describe('CoreTabs', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <CoreTabs value={0} onChange={() => {}}>
          <CoreTab label="First" />
          <CoreTab label="Second" />
          <CoreTab label="Third" />
        </CoreTabs>
      </TestWrapper>,
    );
    const { violations } = await axe.run(container);
    expect(violations).toEqual([]);
  });

  it('after tab change has no accessibility violations', async () => {
    const user = userEvent.setup();
    let value = 0;
    const { container, rerender } = render(
      <TestWrapper>
        <CoreTabs
          value={value}
          onChange={(v) => {
            value = v;
          }}
        >
          <CoreTab label="First" />
          <CoreTab label="Second" />
        </CoreTabs>
      </TestWrapper>,
    );
    await user.click(container.querySelectorAll('[role="tab"]')[1]);
    rerender(
      <TestWrapper>
        <CoreTabs value={value} onChange={() => {}}>
          <CoreTab label="First" />
          <CoreTab label="Second" />
        </CoreTabs>
      </TestWrapper>,
    );
    const { violations } = await axe.run(container);
    expect(violations).toEqual([]);
  });
});
