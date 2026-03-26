export function isPageNavigationDisabled(
  surveyHasConditionalPages: boolean,
  previousPageErrors: Record<string, string[]>[][],
): boolean {
  if (surveyHasConditionalPages) return true;
  return previousPageErrors.some((pageErrors) =>
    pageErrors.some((questionErrors) =>
      Object.values(questionErrors).some((errors) => errors.length > 0),
    ),
  );
}
