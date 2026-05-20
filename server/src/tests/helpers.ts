import { vi } from 'vitest';

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
