import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { CoreCheckbox } from './Checkbox';

it('CoreCheckbox without label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <CoreCheckbox inputProps={{ 'aria-label': 'Accept' }} />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreCheckbox with label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <CoreCheckbox label="Accept terms" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreCheckbox checked state has no accessibility violations', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <TestWrapper>
      <CoreCheckbox label="Accept terms" />
    </TestWrapper>,
  );
  await user.click(container.querySelector('input[type="checkbox"]')!);
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
