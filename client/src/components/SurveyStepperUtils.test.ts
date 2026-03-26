import { describe } from 'vitest';
import { isPageNavigationDisabled } from './SurveyStepperUtils';

describe('stepper page navigation for a page', () => {
  it('should be disabled if survey has conditional pages', () => {
    expect(isPageNavigationDisabled(true, [])).toBe(true);
  });

  it('should be disabled if previous pages have errors', () => {
    const previousPageErrors = [[{ 'Question 1': ['Some error'] }]];
    expect(isPageNavigationDisabled(false, previousPageErrors)).toBe(true);
  });

  it('should be disabled if previous pages are required and unanswered', () => {
    const previousPageErrors = [[{ 'Question 1': ['required'] }]];
    expect(isPageNavigationDisabled(false, previousPageErrors)).toBe(true);
  });

  it('should be enabled if no conditional pages and no previous errors', () => {
    const previousPageErrors: Record<string, string[]>[][] = [
      [{ 'Question 1': [] }],
    ];
    expect(isPageNavigationDisabled(false, previousPageErrors)).toBe(false);
  });
});
