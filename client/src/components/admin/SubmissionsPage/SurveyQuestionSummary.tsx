// @ts-strict-ignore
import { SurveyQuestion } from '@interfaces/survey';
import { Box, Typography } from '@mui/material';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { isSurveyQuestion } from '@src/utils/typeCheck';
import { Dispatch, SetStateAction } from 'react';
import { PageQuestionList } from './PageQuestionList';

interface Props {
  setSelectedQuestion: Dispatch<SetStateAction<SurveyQuestion | null>>;
}

export function SurveyQuestionSummary({ setSelectedQuestion }: Props) {
  const { survey } = useSurveyAnswers();
  const { tr, surveyLanguage } = useTranslations();

  return (
    <>
      {survey.pages.map((page, index) => (
        <Box key={page.id}>
          <Typography sx={{ color: '#818181' }}>
            {tr.SurveySubmissionsPage.pageNumber.replace(
              '{x}',
              String(index + 1),
            )}{' '}
            {page.title[surveyLanguage]}
          </Typography>
          <PageQuestionList
            handleClick={(question: SurveyQuestion) =>
              setSelectedQuestion(question)
            }
            questions={page.sections.filter<SurveyQuestion>((section) =>
              isSurveyQuestion(section),
            )}
          />
        </Box>
      ))}
    </>
  );
}
