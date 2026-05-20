import { describe, expect, it } from 'vitest';
import clientPkg from '../../../../package.json';

const LOCKED_OL_VERSION = '10.9.0';

describe('OpenLayers version lock', () => {
  it(`should be pinned to exactly ${LOCKED_OL_VERSION} — audit WebGLVector API before bumping`, () => {
    expect(clientPkg.dependencies.ol).toBe(LOCKED_OL_VERSION);
  });
});
