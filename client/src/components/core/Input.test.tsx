import { render } from '@testing-library/react';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { CoreInput } from './Input';

it('CoreInput without label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <CoreInput id="test-input" placeholder="Enter value" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreInput with label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <CoreInput id="test-input" label="Name" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
