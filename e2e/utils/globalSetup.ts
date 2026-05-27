import { clearData } from './db';

export default async function globalSetup() {
  await clearData();
}
