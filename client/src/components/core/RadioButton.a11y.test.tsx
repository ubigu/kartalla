import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { RadioButton } from './RadioButton';

it('CoreRadioButton without label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <RadioButton id="test-radio" aria-label="Option" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreRadioButton with label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <RadioButton label="Option A" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreRadioButton checked state has no accessibility violations', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <TestWrapper>
      <RadioButton label="Option A" />
    </TestWrapper>,
  );
  await user.click(container.querySelector('input[type="radio"]')!);
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreRadioButton error state has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <RadioButton label="Option A" error helperText="This field is required" />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('CoreRadioButton disabled state has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <RadioButton label="Option A" disabled />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
