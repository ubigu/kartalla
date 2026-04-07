// @ts-strict-ignore
import {
  SurveyFollowUpSectionParent,
  SurveyPageSection,
  SurveyQuestion,
} from '@interfaces/survey';

export function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`,
  );
}

export function isString(text: unknown): text is string {
  return typeof text === 'string' || text instanceof String;
}

export function isNumeric(val: unknown): val is number {
  return val && !isNaN(Number(val)) && !isNaN(parseFloat(String(val)));
}

export function isSurveyQuestion(
  section: SurveyPageSection,
): section is SurveyQuestion {
  return (
    section.type !== 'text' &&
    section.type !== 'image' &&
    section.type !== 'document'
  );
}

export function isFollowUpSectionParentType(
  section: SurveyPageSection,
): section is SurveyFollowUpSectionParent {
  return (
    section.type === 'radio' ||
    section.type === 'checkbox' ||
    section.type === 'numeric' ||
    section.type === 'slider'
  );
}
