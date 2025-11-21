import {
  MapQuestionAnswer,
  SurveyMapSubQuestion,
  SurveyMapSubQuestionAnswer,
} from '@interfaces/survey';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  FormLabel,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  getEmptyAnswer,
  useSurveyAnswers,
} from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import CheckBoxQuestion from './CheckBoxQuestion';
import FreeTextQuestion from './FreeTextQuestion';
import NumericQuestion from './NumericQuestion';
import RadioQuestion from './RadioQuestion';
import SectionInfo from './SectionInfo';
import { RadioImageQuestion } from './RadioImageQuestion';

const useStyles = makeStyles({
  content: {
    '& > :not(:last-child)': {
      marginBottom: '2rem',
    },
  },
});

interface Props {
  /**
   * Is the dialog open?
   */
  open: boolean;
  /**
   * Title of the question - only displayed when editing existing answers
   */
  title?: string;
  /**
   * Existing subquestion answers - defined only when editing an existing map answer
   */
  answer?: MapQuestionAnswer;
  /**
   * Map sub questions
   */
  subQuestions: SurveyMapSubQuestion[];
  /**
   * Callback for submitting subquestion answers
   */
  onSubmit: (answers: SurveyMapSubQuestionAnswer[]) => void;
  /**
   * Callback for canceling adding/editing a map answer
   */
  onCancel: () => void;
  /**
   * Callback for deleting the existing map answer (not shown for new answers)
   */
  onDelete?: () => void;
}

export default function MapSubQuestionDialog({
  open,
  title,
  answer: existingAnswer,
  subQuestions,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [answers, setAnswers] = useState<SurveyMapSubQuestionAnswer[]>([
    ...(existingAnswer?.subQuestionAnswers ?? []),
  ]);
  const dialogRef = useRef(null);
  const [dirty, setDirty] = useState<boolean[]>([]);
  const classes = useStyles();
  const { getValidationErrors } = useSurveyAnswers();
  const { tr, surveyLanguage } = useTranslations();

  /**
   * Initialize dirty statuses and answers with empty answers when subquestions are changed and/or the dialog is opened
   */
  useEffect(() => {
    if (existingAnswer) {
      // Existing answer provided - set subquestion answers from that
      setAnswers(existingAnswer.subQuestionAnswers);
    } else {
      // New map answer - set subquestion answers empty
      const answers = subQuestions?.map(
        (question) => getEmptyAnswer(question) as SurveyMapSubQuestionAnswer,
      );
      setAnswers(answers);
    }
    // Clear dirty status for each subquestion
    const dirty = subQuestions?.map(() => false);
    setDirty(dirty);
  }, [subQuestions, open, existingAnswer]);

  const validationErrors = useMemo(() => {
    if (!subQuestions || !answers.length) {
      return;
    }
    return subQuestions.map((question) =>
      getValidationErrors(question, answers),
    );
  }, [answers, subQuestions]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-label={tr.MapQuestion.subQuestionDialog}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent className={classes.content}>
        {subQuestions?.map((question, index) => (
          <FormControl
            component="fieldset"
            key={question.id}
            error={dirty?.[index] && validationErrors?.[index].length > 0}
            style={{ width: '100%' }}
            onBlur={(e: React.FocusEvent<HTMLFieldSetElement>) => {
              if (
                e.relatedTarget &&
                !(e.relatedTarget as HTMLButtonElement).classList.contains(
                  'cancel-button',
                ) &&
                !e.currentTarget.contains(e.relatedTarget as Node) &&
                open &&
                !dialogRef?.current?.infoDialogOpen
              ) {
                dirty[index] = true;
                setDirty([...dirty]);
              }
            }}
          >
            <FormLabel
              component="legend"
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              {question.title?.[surveyLanguage]} {question.isRequired && '*'}
              {question.info && question.info?.[surveyLanguage] && (
                <SectionInfo
                  ref={dialogRef}
                  infoText={question.info?.[surveyLanguage]}
                  subject={question.title?.[surveyLanguage]}
                />
              )}
            </FormLabel>

            {question.type === 'checkbox' ? (
              <CheckBoxQuestion
                autoFocus={index === 0}
                value={answers[index]?.value as (number | string)[]}
                onChange={(value) => {
                  answers[index].value = value;
                  setAnswers([...answers]);
                }}
                question={question}
                setDirty={(value) => {
                  dirty[index] = value;
                  setDirty([...dirty]);
                }}
              />
            ) : question.type === 'radio' ? (
              <RadioQuestion
                autoFocus={index === 0}
                value={answers[index]?.value as number | string}
                onChange={(value) => {
                  answers[index].value = value;
                  setAnswers([...answers]);
                }}
                question={question}
                setDirty={(value) => {
                  dirty[index] = value;
                  setDirty([...dirty]);
                }}
              />
            ) : question.type === 'radio-image' ? (
              <RadioImageQuestion
                isMapSubQuestion
                autoFocus={index === 0}
                value={answers[index]?.value as number | string}
                onChange={(value) => {
                  answers[index].value = value;
                  setAnswers([...answers]);
                }}
                question={question}
                setDirty={(value) => {
                  dirty[index] = value;
                  setDirty([...dirty]);
                }}
              />
            ) : question.type === 'free-text' ? (
              <FreeTextQuestion
                autoFocus={index === 0}
                isEmptyAndRequired={validationErrors?.[index].includes(
                  'required',
                )}
                value={answers[index]?.value as string}
                onChange={(value) => {
                  answers[index].value = value;
                  setAnswers([...answers]);
                }}
                question={question}
                setDirty={(value) => {
                  dirty[index] = value;
                  setDirty([...dirty]);
                }}
                maxLength={question.maxLength ?? 500}
              />
            ) : question.type === 'numeric' ? (
              <NumericQuestion
                autoFocus={index === 0}
                isEmptyAndRequired={validationErrors?.[index].includes(
                  'required',
                )}
                value={answers[index]?.value as number}
                onChange={(value) => {
                  answers[index].value = value;
                  setAnswers([...answers]);
                }}
                question={question}
                setDirty={(value) => {
                  dirty[index] = value;
                  setDirty([...dirty]);
                }}
              />
            ) : null}
            {/* Show the required error only for empty values (not when answer limits are broken in checkbox questions) */}
            {dirty?.[index] &&
              validationErrors?.[index].includes('required') && (
                <FormHelperText id={`${question.id}-required-text`}>
                  {tr.SurveyQuestion.errorFieldIsRequired}
                </FormHelperText>
              )}
          </FormControl>
        ))}
      </DialogContent>
      <DialogActions>
        {existingAnswer && (
          <Button
            onClick={() => {
              onDelete();
            }}
            color="error"
          >
            {tr.MapQuestion.removeAnswer}
          </Button>
        )}
        <div style={{ flexGrow: 1 }} />
        {subQuestions && subQuestions.length > 0 && (
          <Button
            className="cancel-button"
            variant="outlined"
            onClick={() => {
              onCancel();
            }}
          >
            {tr.commands.cancel}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => {
            onSubmit(answers);
          }}
          disabled={
            subQuestions &&
            subQuestions.length > 0 &&
            validationErrors?.some((error) => error.length > 0)
          }
        >
          {tr.options.ok}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
