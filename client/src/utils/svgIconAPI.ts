import { SvgIcon } from '@interfaces/survey';
import { request } from './request';

/**
 * Upload a new SVG icon file
 */
export async function uploadSvgIcon(
  file: File,
  originalFilename?: string,
): Promise<SvgIcon> {
  const formData = new FormData();
  formData.append('file', file);
  if (originalFilename) {
    formData.append('originalFilename', originalFilename);
  }

  const response = await fetch('/api/svg-icon', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload SVG icon');
  }

  return response.json();
}

/**
 * Get all SVG icons for the user's organization
 */
export async function getSvgIcons(): Promise<SvgIcon[]> {
  return request<SvgIcon[]>('/api/svg-icon');
}

/**
 * Delete an SVG icon by ID
 */
export async function deleteSvgIcon(iconId: number): Promise<void> {
  await request(`/api/svg-icon/${iconId}`, { method: 'DELETE' });
}
