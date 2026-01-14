import { SurveyFollowUpSection, SurveyPageSection } from '@interfaces/survey';
import { FormGroup, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';

import { ConditionRow } from '../ConditionRow';

interface Props {
  pageId: number;
  parentSection: Extract<
    SurveyPageSection,
    { type: 'numeric' | 'slider' | 'checkbox' | 'radio' }
  >;
  followUpSection: SurveyFollowUpSection;
}

export function FollowUpSectionConditions({
  pageId,
  parentSection,
  followUpSection,
}: Props) {
  const { tr } = useTranslations();
  const { editFollowUpSection } = useSurvey();

  const parentIsNumeric =
    parentSection.type === 'numeric' || parentSection.type === 'slider';

  return (
    <FormGroup>
      <Typography sx={{ fontWeight: 700 }}>
        {parentIsNumeric
          ? tr.FollowUpSection.conditions.labelForMultiple
          : tr.FollowUpSection.conditions.labelForSingle}
      </Typography>
      <ConditionRow
        allowCustomAnswer={
          !(
            parentSection.type === 'numeric' || parentSection.type === 'slider'
          ) && parentSection?.allowCustomAnswer
        }
        conditionIsNumeric={parentIsNumeric}
        label={
          tr.FollowUpSection.conditions.types[
            parentIsNumeric ? 'equals' : 'contains'
          ]
        }
        options={
          parentSection.type === 'numeric' || parentSection.type === 'slider'
            ? []
            : parentSection.options
        }
        conditions={followUpSection.conditions}
        textFieldValue={followUpSection.conditions.equals[0]}
        onInput={(values) =>
          editFollowUpSection(pageId, parentSection.id, {
            ...followUpSection,
            conditions: { ...followUpSection.conditions, equals: values },
          })
        }
      />
      {parentIsNumeric && (
        <>
          <ConditionRow
            conditionIsNumeric
            labelPrefix={tr.FollowUpSection.conditions.types.or}
            label={tr.FollowUpSection.conditions.types.greaterThan}
            textFieldValue={followUpSection.conditions.greaterThan[0]}
            onInput={(values) =>
              editFollowUpSection(pageId, parentSection.id, {
                ...followUpSection,
                conditions: {
                  ...followUpSection.conditions,
                  greaterThan: values,
                },
              })
            }
          />

          <ConditionRow
            conditionIsNumeric
            labelPrefix={tr.FollowUpSection.conditions.types.or}
            label={tr.FollowUpSection.conditions.types.lessThan}
            textFieldValue={followUpSection.conditions.lessThan[0]}
            onInput={(values) =>
              editFollowUpSection(pageId, parentSection.id, {
                ...followUpSection,
                conditions: { ...followUpSection.conditions, lessThan: values },
              })
            }
          />
        </>
      )}
    </FormGroup>
  );
}
