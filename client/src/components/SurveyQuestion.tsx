import type {
  AnswerEntry,
  FileAnswer,
  GeoBudgetingAnswer,
  MapQuestionAnswer,
  PersonalInfoAnswer,
  Submission,
  SurveyQuestion as SurveyQuestionType,
} from '@interfaces/survey';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import BudgetingQuestion from '@src/components/BudgetingQuestion';
import GeoBudgetingQuestion from '@src/components/GeoBudgetingQuestion';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useMemo, useRef, useState } from 'react';
import AttachmentQuestion from './AttachmentQuestion';
import CheckBoxQuestion from './CheckBoxQuestion';
import FreeTextQuestion from './FreeTextQuestion';
import GroupedCheckBoxQuestion from './GroupedCheckBoxQuestion';
import MapQuestion from './MapQuestion';
import MatrixQuestion from './MatrixQuestion';
import MultiMatrixQuestion from './MultiMatrixQuestion';
import NumericQuestion from './NumericQuestion';
import { PersonalInfoQuestion } from './PersonalInfoQuestion';
import { RadioImageQuestion } from './RadioImageQuestion';
import RadioQuestion from './RadioQuestion';
import SectionInfo from './SectionInfo';
import SliderQuestion from './SliderQuestion';
import SortingQuestion from './SortingQuestion';

interface Props {
  question: SurveyQuestionType;
  pageUnfinished: boolean;
  mobileDrawerOpen: boolean;
  readOnly?: boolean;
  value?: AnswerEntry['value'];
  submission?: Submission;
  isFollowUp?: boolean;
}

function SurveyQuestion({
  question,
  pageUnfinished,
  mobileDrawerOpen,
  readOnly = false,
  submission,
  ...props
}: Props) {
  const { answers, updateAnswer, getValidationErrors, survey } =
    useSurveyAnswers();
  const { tr, surveyLanguage } = useTranslations();
  const [dirty, setDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [backdropOpen, setBackdropOpen] = useState(false);
  const infoDialogRef = useRef(null);

  const value = useMemo(
    () =>
      typeof props.value !== 'undefined'
        ? props.value
        : // If submission is given via props, use them instead of context
          (submission?.answerEntries ?? answers).find(
            (answer) => answer.sectionId === question.id,
          )?.value,
    [answers, submission, question, props.value],
  );

  const validationErrors = useMemo(
    () => (dirty || pageUnfinished ? getValidationErrors(question) : []),
    [dirty, question, value, pageUnfinished],
  );

  return (
    <FormControl
      disabled={readOnly}
      component="fieldset"
      className={'question-fieldset'}
      required={question.isRequired}
      aria-required={question.isRequired}
      aria-invalid={validationErrors.includes('required')}
      error={validationErrors.length > 0}
      style={{ width: '100%' }}
      onBlur={(e: React.FocusEvent<HTMLFieldSetElement>) => {
        if (
          e.relatedTarget &&
          !e.currentTarget.contains(e.relatedTarget as Node) &&
          !dialogOpen &&
          !backdropOpen &&
          !infoDialogRef?.current?.infoDialogOpen &&
          !mobileDrawerOpen
        ) {
          setDirty(true);
        }
      }}
    >
      {/* Show the required error only for empty values (not when answer limits are broken in checkbox questions) */}
      {validationErrors.includes('required') && (
        <>
          <FormHelperText
            id={`${question.id}-required-text`}
            sx={{ marginLeft: 0 }}
          >
            {tr.SurveyQuestion.errorFieldIsRequired}
          </FormHelperText>
          <FormHelperText style={visuallyHidden} role="alert">
            {tr.SurveyQuestion.accessibilityTooltip}{' '}
            {question.title?.[surveyLanguage]}
          </FormHelperText>
        </>
      )}
      <FormLabel
        component="legend"
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography
          component="h3"
          sx={{
            marginBottom: readOnly ? '1rem' : '',
            ...(survey.sectionTitleColor && {
              color: survey.sectionTitleColor,
            }),
          }}
          variant={props.isFollowUp ? 'followUpSectionTitle' : 'questionTitle'}
        >
          {question.title?.[surveyLanguage]}
          <span aria-hidden="true"> </span>
        </Typography>
        {question.type == 'sorting' && (
          <span style={visuallyHidden}>
            {tr.SortingQuestion.confirmationGuide}
          </span>
        )}
        {question.info && question.info?.[surveyLanguage] && (
          <SectionInfo
            ref={infoDialogRef}
            hiddenFromScreenReader={false}
            infoText={question.info?.[surveyLanguage]}
            subject={question.title?.[surveyLanguage]}
          />
        )}
      </FormLabel>
      {/* Personal info question */}
      {question.type === 'personal-info' && (
        <PersonalInfoQuestion
          value={value as PersonalInfoAnswer}
          onChange={(value, hasError) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
              hasError,
            });
          }}
          question={question}
        />
      )}

      {/* Radio question */}
      {question.type === 'radio' && (
        <RadioQuestion
          value={value as number | string}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
        />
      )}
      {/* Radio image question */}
      {question.type === 'radio-image' && (
        <RadioImageQuestion
          value={value as number | string}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
        />
      )}
      {/* Checkbox question */}
      {question.type === 'checkbox' && (
        <CheckBoxQuestion
          value={value as (number | string)[]}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
          validationErrors={validationErrors}
        />
      )}
      {/* Free text question */}
      {question.type === 'free-text' && (
        <FreeTextQuestion
          readOnly={readOnly}
          value={value as string}
          maxLength={question.maxLength}
          isEmptyAndRequired={validationErrors.includes('required')}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
        />
      )}
      {/* Numeric question */}
      {question.type === 'numeric' && (
        <NumericQuestion
          readOnly={readOnly}
          value={value as number}
          isEmptyAndRequired={validationErrors.includes('required')}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
        />
      )}
      {/* Map question */}
      {question.type === 'map' && (
        <MapQuestion
          value={value as MapQuestionAnswer[]}
          setDialogOpen={setDialogOpen}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          mobileDrawerOpen={mobileDrawerOpen}
        />
      )}
      {/* Sorting question */}
      {question.type === 'sorting' && (
        <SortingQuestion
          readOnly={readOnly}
          value={value as number[]}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
        />
      )}
      {/* Slider question */}
      {question.type === 'slider' && (
        <SliderQuestion
          readOnly={readOnly}
          value={value as number}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
        />
      )}
      {question.type === 'matrix' && (
        <MatrixQuestion
          value={value as string[]}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
          setBackdropOpen={setBackdropOpen}
        />
      )}
      {question.type === 'multi-matrix' && (
        <MultiMatrixQuestion
          readOnly={readOnly}
          value={value as string[][]}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
          setBackdropOpen={setBackdropOpen}
          validationErrors={validationErrors}
        />
      )}
      {question.type === 'grouped-checkbox' && (
        <GroupedCheckBoxQuestion
          readOnly={readOnly}
          value={value as number[]}
          onChange={(value) => {
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            });
          }}
          question={question}
          setDirty={setDirty}
        />
      )}
      {question.type === 'attachment' && (
        <AttachmentQuestion
          readOnly={readOnly}
          question={question}
          value={value as FileAnswer[]}
          setDirty={setDirty}
          onChange={(value) =>
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value: value,
            })
          }
        />
      )}
      {question.type === 'budgeting' && (
        <BudgetingQuestion
          readOnly={readOnly}
          question={question}
          value={value as number[]}
          setDirty={setDirty}
          validationErrors={validationErrors}
          onChange={(value) =>
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            })
          }
        />
      )}
      {question.type === 'geo-budgeting' && (
        <GeoBudgetingQuestion
          readOnly={readOnly}
          question={question}
          setDialogOpen={setDialogOpen}
          value={value as GeoBudgetingAnswer[]}
          validationErrors={validationErrors}
          onChange={(value) =>
            updateAnswer({
              sectionId: question.id,
              type: question.type,
              value,
            })
          }
        />
      )}
    </FormControl>
  );
}

export default SurveyQuestion;
