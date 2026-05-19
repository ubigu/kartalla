import { TestWrapper } from '@src/test/TestWrapper';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OlMap } from './OlMap';

const mockDispose = vi.fn();
const mockSetTarget = vi.fn();
const mockOn = vi.fn();
const mockAddLayer = vi.fn();

vi.mock('ol/Map', () => ({
  default: vi.fn(function () {
    return {
      dispose: mockDispose,
      setTarget: mockSetTarget,
      on: mockOn,
      addLayer: mockAddLayer,
    };
  }),
}));

vi.mock('ol/View', () => ({ default: vi.fn() }));
vi.mock('ol/interaction', () => ({ defaults: vi.fn(() => []) }));
vi.mock('./layers', () => ({
  createOsmLayer: vi.fn(() => ({})),
  buildBaseLayer: vi.fn(() => null),
}));
vi.mock('ol/ol.css', () => ({}));
vi.mock('@src/utils/request', () => ({
  request: vi.fn(() => Promise.resolve([])),
}));

describe('OlMap', () => {
  it('cleans up webgl context on unmount', async () => {
    const { unmount } = render(
      <TestWrapper>
        <OlMap />
      </TestWrapper>,
    );
    await waitFor(() => expect(mockDispose).not.toHaveBeenCalled());
    unmount();
    expect(mockDispose).toHaveBeenCalledOnce();
  });
});
