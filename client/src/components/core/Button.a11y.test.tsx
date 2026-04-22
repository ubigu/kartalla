import { Button } from '@mui/material';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { expect, it } from 'vitest';
import { TestWrapper } from '../../test/TestWrapper';

it('Button contained has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Button variant="contained">Seuraava</Button>
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});

it('Button outlined has no accessibility violations', async () => {
  const { container } = render(
    <TestWrapper>
      <Button variant="outlined">Edellinen</Button>
    </TestWrapper>,
  );
  const { violations } = await axe.run(container);
  expect(violations).toEqual([]);
});
