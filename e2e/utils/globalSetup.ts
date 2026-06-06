import { clearData, setMockUserDefaultLanguage } from './db';

export default async function globalSetup() {
  await clearData();
  await setMockUserDefaultLanguage('fi');
}
