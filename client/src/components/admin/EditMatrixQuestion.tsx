import { LocalizedText, SurveyMatrixQuestion } from '@interfaces/survey';
import {
  Checkbox,
  Fab,
  FormControlLabel,
  FormGroup,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@src/components/icons/AddIcon';
import CancelIcon from '@src/components/icons/CancelIcon';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';
import QuestionOptions from './QuestionOptions';

interface Props {
  section: SurveyMatrixQuestion;
  onChange: (section: SurveyMatrixQuestion) => void;
}

export default function EditMatrixQuestion({ section, onChange }: Props) {
  const { tr, surveyLanguage, initializeLocalizedObject } = useTranslations();

  return (
    <>
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              name="is-required"
              checked={section.isRequired}
              onChange={(event) => {
                onChange({
                  ...section,
                  isRequired: event.target.checked,
                });
              }}
            />
          }
          label={tr.SurveySections.isRequired}
        />
      </FormGroup>
      <FormGroup row>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Fab
            color="primary"
            aria-label="add-matrix-class"
            size="small"
            sx={{ boxShadow: 'none' }}
            onClick={() => {
              onChange({
                ...section,
                classes: [...section.classes, initializeLocalizedObject(null)],
              });
            }}
          >
            <AddIcon />
          </Fab>
          <Typography style={{ paddingLeft: '1rem' }}>
            {tr.SurveySections.classes}{' '}
          </Typography>
        </div>
      </FormGroup>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {section.classes?.map((entry: LocalizedText, index) => {
          return (
            <div
              key={`matrix-class-${index}`}
              data-testid={`matrix-class-${index}`}
              style={{ position: 'relative' }}
            >
              <Tooltip title={entry[surveyLanguage] ?? ''}>
                <TextField
                  inputProps={{ autoFocus: true }}
                  style={{
                    marginRight: '0.25rem',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}
                  value={entry[surveyLanguage] ?? ''}
                  onChange={(event) => {
                    const updatedClasses = [...section.classes];
                    updatedClasses[index][surveyLanguage] = event.target.value;
                    onChange({ ...section, classes: updatedClasses });
                  }}
                >
                  {entry[surveyLanguage]}
                </TextField>
              </Tooltip>
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => {
                  const updatedClasses = [...section.classes];
                  updatedClasses.splice(index, 1);
                  onChange({
                    ...section,
                    classes: updatedClasses,
                  });
                }}
                style={{ position: 'absolute', top: '-1rem', right: '0.1rem' }}
              >
                <CancelIcon />
              </IconButton>
            </div>
          );
        })}
      </div>
      <QuestionOptions
        options={section.subjects.map((subject) => ({ text: subject }))}
        onChange={(subjects: any) => {
          onChange({
            ...section,
            subjects: subjects.map((subject: any) => ({ ...subject.text })),
          });
        }}
        title={tr.SurveySections.subjects}
      />

      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              name="allow-empty-answer"
              checked={section.allowEmptyAnswer}
              onChange={(event) => {
                onChange({
                  ...section,
                  allowEmptyAnswer: event.target.checked,
                });
              }}
            />
          }
          label={tr.SurveySections.allowEmptyAnswer}
        />
      </FormGroup>
    </>
  );
}
