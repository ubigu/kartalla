import {
  BudgetAllocationDirection,
  SurveyBudgetingQuestion,
} from '@interfaces/survey';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Switch,
  TextField,
} from '@mui/material';
import { QuestionBudgetTargets } from '@src/components/admin/QuestionBudgetTargets';
import RichTextEditor from '@src/components/RichTextEditor';
import { useTranslations } from '@src/stores/TranslationContext';

interface Props {
  section: SurveyBudgetingQuestion;
  onChange: (section: SurveyBudgetingQuestion) => void;
}

export default function EditBudgetingQuestion({ section, onChange }: Props) {
  const { tr, surveyLanguage } = useTranslations();
  return (
    <FormGroup sx={{ gap: 2 }}>
      <FormControlLabel
        label={tr.BudgetingQuestion.budgetByPieces}
        control={
          <Switch
            checked={section.budgetingMode === 'pieces'}
            onChange={(event) =>
              onChange({
                ...section,
                budgetingMode: event.target.checked ? 'pieces' : 'direct',
              })
            }
          />
        }
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          type="number"
          label={tr.BudgetingQuestion.totalBudget}
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
          label={tr.BudgetingQuestion.unit}
          value={section.unit ?? ''}
          onChange={(event) =>
            onChange({
              ...section,
              unit: event.target.value,
            })
          }
        />
      </Box>
      <QuestionBudgetTargets
        section={section}
        targets={section.targets}
        onChange={(targets) =>
          onChange({
            ...section,
            targets,
          })
        }
      />
      <FormControlLabel
        disabled={section.budgetingMode === 'pieces'}
        label={tr.BudgetingQuestion.requireFullAllocation}
        control={
          <Checkbox
            checked={
              section.budgetingMode === 'direct' &&
              section.requireFullAllocation
            }
            onChange={(event) =>
              onChange({
                ...section,
                requireFullAllocation: event.target.checked,
              })
            }
          />
        }
      />
      <Box>
        <Box sx={{ mb: 1 }}>{tr.BudgetingQuestion.inputMode}</Box>
        <RadioGroup
          row
          value={section.inputMode ?? 'absolute'}
          onChange={(event) =>
            onChange({
              ...section,
              inputMode: event.target.value as 'absolute' | 'percentage',
            })
          }
        >
          <FormControlLabel
            disabled={section.budgetingMode === 'pieces'}
            value="absolute"
            label={tr.BudgetingQuestion.absoluteMode}
            control={<Radio />}
          />
          <FormControlLabel
            disabled={section.budgetingMode === 'pieces'}
            value="percentage"
            label={tr.BudgetingQuestion.percentageMode}
            control={<Radio />}
          />
        </RadioGroup>
      </Box>
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
          label={tr.BudgetingQuestion.allocationDirectionIncreasing}
          control={<Radio />}
        />
        <FormControlLabel
          value="decreasing"
          label={tr.BudgetingQuestion.allocationDirectionDecreasing}
          control={<Radio />}
        />
      </RadioGroup>
      <RichTextEditor
        value={section.helperText[surveyLanguage]}
        label={tr.BudgetingQuestion.helperText}
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
