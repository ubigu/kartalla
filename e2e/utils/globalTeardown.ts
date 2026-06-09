import { clearData } from './db';

export default async function globalTeardown() {
  await clearData();
}
