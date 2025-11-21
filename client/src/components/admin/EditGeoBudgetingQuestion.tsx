import {
  BudgetAllocationDirection,
  SurveyGeoBudgetingQuestion,
} from '@interfaces/survey';
import {
  Box,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { GeoBudgetTargets } from '@src/components/admin/GeoBudgetTargets';
import RichTextEditor from '@src/components/RichTextEditor';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';

interface Props {
  section: SurveyGeoBudgetingQuestion;
  onChange: (section: SurveyGeoBudgetingQuestion) => void;
}

export function EditGeoBudgetingQuestion({ section, onChange }: Props) {
  const { tr, surveyLanguage } = useTranslations();
  return (
    <FormGroup sx={{ gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          type="number"
          label={tr.GeoBudgetingQuestion.totalBudget}
          value={String(section.totalBudget)}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), 0);
            onChange({
              ...section,
              totalBudget: value,
            });
          }}
        />
        <TextField
          label={tr.GeoBudgetingQuestion.unit}
          value={section.unit ?? ''}
          onChange={(event) =>
            onChange({
              ...section,
              unit: event.target.value,
            })
          }
        />
      </Box>
      <GeoBudgetTargets
        section={section}
        targets={section.targets}
        onChange={(targets) =>
          onChange({
            ...section,
            targets,
          })
        }
      />
      <RadioGroup
        value={section.allocationDirection}
        onChange={(event) =>
          onChange({
            ...section,
            allocationDirection: event.target
              .value as BudgetAllocationDirection,
          })
        }
      >
        <FormControlLabel
          value="increasing"
          label={tr.GeoBudgetingQuestion.allocationDirectionIncreasing}
          control={<Radio />}
        />
        <FormControlLabel
          value="decreasing"
          label={tr.GeoBudgetingQuestion.allocationDirectionDecreasing}
          control={<Radio />}
        />
      </RadioGroup>
      <RichTextEditor
        value={section.helperText?.[surveyLanguage] ?? ''}
        label={tr.GeoBudgetingQuestion.helperText}
        onChange={(value) =>
          onChange({
            ...section,
            helperText: {
              ...section.helperText,
              [surveyLanguage]: value,
            },
          })
        }
      />
    </FormGroup>
  );
}
