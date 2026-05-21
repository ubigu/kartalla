import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import logger from '@src/logger';

type SecretKeys =
  | 'userGroupNameMapping'
  | 'allowedFrameSources'
  | 'allowedImageSources';

/** Secrets are used to get the value directly from Azure Key vault and they enable application state refresh without restart using the "/keyvault" route. */
export const secrets: Partial<Record<SecretKeys, string>> = {};

export async function initSecrets() {
  const credential = new DefaultAzureCredential();
  const keyVaultUrl = process.env['KEY_VAULT_URL'];
  if (!keyVaultUrl) {
    logger.info('KEY_VAULT_URL is empty, using only environment variables.');
    return;
  }

  const client = new SecretClient(keyVaultUrl, credential);

  for await (const secretProperties of client.listPropertiesOfSecrets()) {
    const secret = await client.getSecret(secretProperties.name);
    if (secret.value) {
      secrets[secretProperties.name] = secret.value;
    }
  }
}
