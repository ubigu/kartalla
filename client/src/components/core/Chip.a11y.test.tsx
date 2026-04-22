import { render } from '@testing-library/react';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { CoreChip } from './Chip';

it('CoreChip filled has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <CoreChip label="Status" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreChip outlined has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <CoreChip label="Status" variant="outlined" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreChip clickable has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <CoreChip label="Clickable" onClick={() => {}} />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
