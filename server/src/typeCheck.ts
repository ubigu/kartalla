import {
  SurveyFollowUpSectionParent,
  SurveyPageSection,
} from '@interfaces/survey';

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
