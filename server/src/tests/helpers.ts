import { vi } from 'vitest';

export function mockLogger() {
  return { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
}

export function buildMockDb() {
  const mockDb: any = {
    none: vi.fn().mockResolvedValue(undefined),
    one: vi.fn(),
    oneOrNone: vi.fn(),
    manyOrNone: vi.fn().mockResolvedValue([]),
    any: vi.fn().mockResolvedValue([]),
    tx: vi.fn().mockImplementation(async (callback: any) => callback(mockDb)),
  };
  return mockDb;
}
