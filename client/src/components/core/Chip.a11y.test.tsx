import { render } from '@testing-library/react';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { Chip } from './Chip';

it('CoreChip filled has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Chip label="Status" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreChip outlined has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Chip label="Status" variant="outlined" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreChip clickable has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Chip label="Clickable" onClick={() => {}} />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
