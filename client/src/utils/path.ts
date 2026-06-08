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
  return typeof fileUrl === 'string'
    ? (fileUrl.split('/').pop() ?? null)
    : null;
}

/**
 * Builds the public URL for a survey based on the current window origin.
 * @param organizationName The organization the survey belongs to
 * @param surveyName The survey's URL name
 * @param options.test When true, returns the test survey URL (with `/testi` suffix)
 * @returns The full public survey URL, or null if the survey has no name
 */
export function getPublicSurveyUrl(
  organizationName: string,
  surveyName?: string | null | undefined,
  options?: { test?: boolean; excludeProtocol?: boolean },
) {
  const origin = options?.excludeProtocol
    ? window.location.host
    : window.location.origin;
  const url = `${origin}/${organizationName}/${surveyName ?? ''}`;
  return options?.test ? `${url}/testi` : url;
}
