import { render } from '@testing-library/react';
import TranslationProvider from '@src/stores/TranslationContext';

describe('ApplicationLogic', function () {
  test('should render without crashing', async function () {
    render(
      <TranslationProvider>
        <p>children</p>
      </TranslationProvider>,
    );
  });
});
