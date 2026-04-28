import { render } from '@testing-library/react';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';
import { Combobox_WIP } from './Combobox';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

it('Combobox without label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Combobox_WIP
        id="test-select"
        value="a"
        options={options}
        aria-label="Choose option"
        onChange={() => {}}
      />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('Combobox with label has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Combobox_WIP
        id="test-select"
        label="Choose option"
        value="a"
        options={options}
        onChange={() => {}}
      />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('Combobox with helper text has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Combobox_WIP
        id="test-select"
        label="Choose option"
        helperText="Select one of the options"
        value="a"
        options={options}
        onChange={() => {}}
      />
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
