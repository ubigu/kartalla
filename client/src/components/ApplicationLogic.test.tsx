import TranslationProvider from '@src/stores/TranslationContext';
import { render } from '@testing-library/react';
import { describe } from 'vitest';

describe('ApplicationLogic', function () {
  test('should render without crashing', async function () {
    render(
      <TranslationProvider>
        <p>children</p>
      </TranslationProvider>,
    );
  });
});
