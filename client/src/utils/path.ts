/**
 * Creates full file path with given organization, file name and file path.
 * @param organizationId The organization that uploaded the file
 * @param filePath File path as an array of path segments
 * @param fileName File name
 * @returns Full file path
 */
export function getFullFilePath(
  organizationId: string,
  filePath: string[],
  fileName: string,
) {
  return `${organizationId}/${filePath.join('/')}/${fileName}`;
}

/**
 * Returns the name of the file that is expected to be found after the
 * last slash in the URL path
 * @param fileUrl Url of the file
 * @returns Filename
 */
export function getFileName(fileUrl: string) {
  return typeof fileUrl === 'string' ? fileUrl.split('/').pop() ?? null : null;
}
