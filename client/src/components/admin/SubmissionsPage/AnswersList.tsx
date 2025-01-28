import {
  AnswerEntry,
  Submission,
  SurveyQuestion as Question,
  SurveyMapQuestion,
} from '@interfaces/survey';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import ChevronDownSmallIcon from '@src/components/icons/ChevronDownSmallIcon';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';
import SurveyQuestion from '@src/components/SurveyQuestion';
import { format } from 'date-fns';
import { SurveyFollowUpSections } from '@src/components/SurveyFollowUpSections';

interface Props {
  answers: AnswerItem[];
  selectedQuestion: Question;
  selectedAnswer: AnswerSelection;
  setSelectedAnswer: (answer: AnswerSelection) => void;
  submissions: Submission[];
  surveyQuestions: Question[];
  surveyId: number;
  modifyAnswerCallback: () => void;
}

export interface AnswerSelection {
  submissionId: number;
  questionId: number;
  index: number;
}

export interface AnswerItem {
  submission: Submission;
  entry: AnswerEntry & { index?: number };
}

function isItemSelected(
  item: AnswerItem,
  selection: AnswerSelection,
  selectedQuestion: Question,
) {
  if (!selection) return false;

  if (selectedQuestion.type === 'map') {
    return (
      item.submission.id === selection.submissionId &&
      item.entry.sectionId === selection.questionId &&
      item.entry.index === selection.index
    );
  }
  return (
    item.submission.id === selection.submissionId &&
    item.entry.sectionId === selection.questionId
  );
}

export default function AnswersList({
  answers,
  selectedQuestion,
  selectedAnswer,
  setSelectedAnswer,
  surveyQuestions,
}: Props) {
  const { tr } = useTranslations();

  return (
    <div style={{ margin: '0 -1rem' }}>
      {selectedQuestion &&
        answers.length > 0 &&
        answers.map((answer, index) => (
          <Accordion
            sx={{
              borderTop: '1px solid rgba(0, 0, 0, 0.15)',
              '&:first-of-type, &:last-child': { borderTop: 0 },
            }}
            elevation={0}
            key={index}
            expanded={isItemSelected(answer, selectedAnswer, selectedQuestion)}
            slotProps={{
              transition: {
                onEntered: (node) =>
                  node.scrollIntoView({ behavior: 'smooth', block: 'end' }),
              },
            }}
            onChange={(_event, isExpanded) => {
              if (isExpanded) {
                setSelectedAnswer({
                  submissionId: answer.submission.id,
                  questionId: answer.entry.sectionId,
                  index: answer.entry.index,
                });
              } else if (
                isItemSelected(answer, selectedAnswer, selectedQuestion)
              ) {
                setSelectedAnswer(null);
              }
            }}
          >
            <AccordionSummary
              sx={{
                gap: '1rem',
                flexDirection: 'row-reverse',
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                  transform: 'rotate(180deg)',
                },
                '&.MuiButtonBase-root': {
                  '&:hover': { backgroundColor: '#41BBFF33' },
                },

                '& .MuiAccordionSummary-content': {
                  margin: 0,
                },
              }}
              expandIcon={<ChevronDownSmallIcon />}
            >
              <div style={{ flexGrow: 1 }}>
                <Typography
                  sx={{
                    fontWeight: isItemSelected(
                      answer,
                      selectedAnswer,
                      selectedQuestion,
                    )
                      ? 700
                      : 400,
                  }}
                >
                  {tr.AnswersList.respondent.replace(
                    '{x}',
                    String(answer.submission.id),
                  )}
                </Typography>
              </div>
              {(index === 0 ||
                answer.submission.id !== answers[index - 1].submission.id) && (
                <Typography style={{ color: '#797979' }}>
                  {format(answer.submission.timestamp, 'dd.MM.yyyy')}
                </Typography>
              )}
            </AccordionSummary>
            {isItemSelected(answer, selectedAnswer, selectedQuestion) && (
              <AccordionDetails sx={{ borderTop: 0, padding: '1rem 2rem' }}>
                {answer.entry.type === 'map' ? (
                  <>
                    {(answer.entry as AnswerEntry & { type: 'map' }).value.map(
                      (item) =>
                        item.subQuestionAnswers.map(
                          (subquestionAnswer, index) => (
                            <SurveyQuestion
                              pageUnfinished={false}
                              mobileDrawerOpen={false}
                              key={index}
                              readOnly
                              question={(
                                surveyQuestions.find(
                                  (question) =>
                                    question.id === answer.entry.sectionId,
                                ) as SurveyMapQuestion
                              )?.subQuestions?.find(
                                (subQuestion) =>
                                  subQuestion.id ===
                                  subquestionAnswer.sectionId,
                              )}
                              value={subquestionAnswer.value}
                            />
                          ),
                        ),
                    )}
                  </>
                ) : (
                  <>
                    <SurveyQuestion
                      readOnly
                      pageUnfinished={false}
                      mobileDrawerOpen={false}
                      question={
                        selectedQuestion?.id === 0
                          ? surveyQuestions.find(
                              (question) =>
                                question.id === answer.entry.sectionId,
                            )
                          : selectedQuestion
                      }
                      submission={answer.submission}
                      value={answer.entry.value}
                    />
                    <SurveyFollowUpSections
                      answer={answer}
                      section={
                        selectedQuestion?.id === 0
                          ? surveyQuestions.find(
                              (question) =>
                                question.id === answer.entry.sectionId,
                            )
                          : selectedQuestion
                      }
                      mobileDrawerOpen={false}
                      pageUnfinished={false}
                    />
                  </>
                )}
              </AccordionDetails>
            )}
          </Accordion>
        ))}
    </div>
  );
}
