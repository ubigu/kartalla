// @ts-strict-ignore
import { Survey } from '@interfaces/survey';
import { request } from '@src/utils/request';

const apiURL = '/api/file';

export async function getInstructionFilename() {
  const response = await fetch(`${apiURL}/instructions`, { method: 'HEAD' });
  return JSON.parse(response.headers.get('File-details')).name;
}

export async function storeAdminInstructions(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  await fetch(`${apiURL}/instructions`, { method: 'POST', body: formData });
}

export async function duplicateFileOnDb(
  originalPath: string,
  surveyId: number,
  organizationId: string,
) {
  const response = await request<{ url: string }>(
    `${apiURL}/copy/${originalPath}`,
    {
      method: 'POST',
      body: { surveyId, organizationId },
    },
  );
  return response;
}

export async function duplicateFiles<T extends object>(
  object: T,
  activeSurvey: Survey,
) {
  if (typeof object !== 'object' || object == null) return object;

  // check for files in attachment/media sections
  await processFileUrl(object, 'fileUrl', activeSurvey);
  // Check for image on sidepanel
  await processFileUrl(object, 'imageUrl', activeSurvey);

  Object.keys(object).map((key) => {
    const child = object[key as keyof typeof object];
    if (Array.isArray(child)) {
      child
        .filter((item) => typeof item === 'object')
        .map((item) => {
          duplicateFiles(item, activeSurvey);
        });
    } else if (typeof child === 'object') {
      duplicateFiles(child, activeSurvey);
    }
  });
  return object;
}

async function processFileUrl(
  object: { [key in 'fileUrl' | 'imageUrl']?: string },
  key: 'fileUrl' | 'imageUrl',
  targetSurvey: Survey,
) {
  if (key in object && object[key] != null && typeof object[key] === 'string') {
    const { url } = await duplicateFileOnDb(
      object[key],
      targetSurvey.id,
      targetSurvey.organization.id,
    );
    object[key] = url;
  }
}
