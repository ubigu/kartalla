import { render } from '@testing-library/react';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { InputHelperText } from './InputHelperText';

it('InputHelperText has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <InputHelperText>Helper message</InputHelperText>
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('InputHelperText error state has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <InputHelperText isError>This field is required</InputHelperText>
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
