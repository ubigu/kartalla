import {
  AnswerEntry,
  Submission,
  Survey,
  SurveyQuestion,
} from '@interfaces/survey';
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import Chart from '@src/components/admin/SubmissionsPage/SurveySubmissionsChart';
import MapIcon from '@src/components/icons/MapIcon';
import {
  isAnswerEmpty,
  nonQuestionSectionTypes,
  useSurveyAnswers,
} from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminAppBar } from '../AdminAppBar';
import DataExport from '../DataExport';
import AnswerMap from './AnswerMap';
import AnswersList, { AnswerItem, AnswerSelection } from './AnswersList';
import { DataChart } from './DataChart';
import SplitPaneLayout from './SplitPaneLayout';
import { SurveyQuestionSummary } from './SurveyQuestionSummary';
import DataPublish from '../DataPublish';
import React from 'react';

function isMapEntry(
  entry: AnswerEntry,
): entry is AnswerEntry & { type: 'map' } {
  return entry.type === 'map';
}

function answerEntryToItems(
  submission: Submission,
  entry: AnswerEntry,
): AnswerItem[] {
  if (!isMapEntry(entry)) {
    return [{ submission, entry }];
  }
  return entry.value.map((value, index) => ({
    submission,
    entry: {
      sectionId: entry.sectionId,
      type: entry.type,
      value: [value],
      index,
    },
  }));
}

export default function SurveySubmissionsPage() {
  const { name, surveyId } = useParams<{ name: string; surveyId: string }>();
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState<Submission[]>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerSelection>(null);
  const [refreshSurvey, setRefreshSurvey] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<SurveyQuestion>(null);

  const { survey, setSurvey } = useSurveyAnswers();
  const { tr, surveyLanguage } = useTranslations();

  const loading = useMemo(() => {
    return surveyLoading || submissionsLoading || responsesLoading;
  }, [surveyLoading, submissionsLoading, responsesLoading]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }
    if (error.status === 404) {
      return tr.SurveyPage.errorSurveyNotFound;
    }
    return tr.SurveyPage.errorFetchingSurvey;
  }, [error]);

  // Fetch survey data from server
  useEffect(() => {
    setSurveyLoading(true);
    async function fetchSurvey() {
      const requestUrl = name
        ? `/api/surveys/by-name/${name}`
        : `/api/surveys/${surveyId}`;
      try {
        const survey = await request<Survey>(requestUrl);
        setSurvey(survey);
      } catch (error) {
        setError(error);
      }
      setSurveyLoading(false);
    }
    fetchSurvey();

    // cleanup to prevent old survey mixing up with the new one when moving between submission pages
    return () => setSurvey(null);
  }, [name, surveyId]);

  // Fetch submissions from server after the survey has been loaded
  useEffect(() => {
    if (survey == null) {
      return;
    }

    setSubmissionsLoading(true);
    async function fetchSubmissions() {
      const submissionUrl = `/api/surveys/${survey.id}/submissions?withPersonalInfo=true`;
      try {
        const submissions = await request<Submission[]>(submissionUrl);
        setSubmissions(
          submissions.map((submission) => ({
            ...submission,
            timestamp: new Date(submission.timestamp),
          })),
        );
      } catch (error) {
        setError(error);
      }
      setSubmissionsLoading(false);
    }
    fetchSubmissions();
  }, [survey, refreshSurvey]);

  // Fetch submission/answer responses after the survey has been loaded
  useEffect(() => {
    if (survey == null) {
      return;
    }
    setResponsesLoading(true);
    async function fetchResponses() {
      try {
        //await loadResponses(survey.id);
      } catch (error) {
        setError(error);
      }
      setResponsesLoading(false);
    }
    fetchResponses();
  }, [survey]);

  // TODO: Could surveyQuestions and questions be combined into a single variable?
  const surveyQuestions = useMemo(() => {
    if (!survey) return;
    return survey?.pages.reduce((prevValue, currentValue) => {
      return [...prevValue, ...currentValue.sections];
    }, []);
  }, [survey]);

  // All map type questions across the entire survey
  const questions = useMemo(() => {
    if (!survey) return;
    return survey.pages.reduce(
      (questions, page) => [
        ...questions,
        ...page.sections.filter(
          (section): section is SurveyQuestion =>
            !nonQuestionSectionTypes.includes(section.type),
        ),
      ],
      [
        {
          id: 0,
          title: { [surveyLanguage]: tr.SurveySubmissionsPage.summary },
        },
      ] as SurveyQuestion[],
    );
  }, [survey]);

  /**
   * All answers flattened from all submissions
   */

  const allAnswers = useMemo(() => {
    return submissions?.reduce(
      (answerEntries, submission) => [
        ...answerEntries,
        ...submission.answerEntries.reduce(
          (items, entry) => [
            ...items,
            ...answerEntryToItems(submission, entry),
          ],
          [] as AnswerItem[],
        ),
      ],
      [] as AnswerItem[],
    );
  }, [submissions]);
  /**
   * Currently visible answers
   */

  const answers = useMemo(() => {
    return selectedQuestion?.id === 0 || !selectedQuestion
      ? allAnswers
      : allAnswers.filter(
          (answer) =>
            answer.entry.sectionId === selectedQuestion.id &&
            !isAnswerEmpty(selectedQuestion, answer.entry.value),
        );
  }, [allAnswers, selectedQuestion]);

  return loading ? (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  ) : error ? (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="body1">{errorMessage}</Typography>
    </Box>
  ) : (
    <>
      <AdminAppBar
        labels={[survey.title[surveyLanguage], tr.AnswersList.answers]}
      />
      <SplitPaneLayout
        mainPane={
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <FormControl size="medium" variant="filled" fullWidth>
              <InputLabel id="select-label">
                {tr.SurveySection.question}
              </InputLabel>

              <Select
                sx={{ fontWeight: 400, fontSize: '24px' }}
                value={selectedQuestion?.id ?? 0}
                label={tr.SurveySection.question}
                onChange={(event) => {
                  if (!questions) return;
                  setSelectedAnswer(null);
                  setSelectedQuestion(
                    questions.find(
                      (question) => question.id === event.target.value,
                    ),
                  );
                }}
              >
                {questions.map((question) => (
                  <MenuItem key={question.id} value={question.id}>
                    {question.title[surveyLanguage]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedQuestion?.id === 0 ? (
              <>
                <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>
                  {tr.SurveySubmissionsPage.answerCount.replace(
                    '{x}',
                    String(submissions?.length ?? 0),
                  )}
                </Typography>
                <DataChart
                  submissions={submissions}
                  submissionsLoading={submissionsLoading}
                />
                <Stack direction="row" spacing={2}>
                  <DataExport surveyId={survey.id} />
                  <DataPublish surveyId={survey.id} />
                </Stack>
                <SurveyQuestionSummary
                  setSelectedQuestion={setSelectedQuestion}
                />
              </>
            ) : (
              <>
                <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>
                  {tr.SurveySubmissionsPage.answerCount.replace(
                    '{x}',
                    String(answers?.length ?? 0),
                  )}
                </Typography>
                <AnswersList
                  answers={answers}
                  modifyAnswerCallback={() => setRefreshSurvey((prev) => !prev)}
                  submissions={submissions}
                  selectedQuestion={selectedQuestion}
                  selectedAnswer={selectedAnswer}
                  setSelectedAnswer={setSelectedAnswer}
                  surveyQuestions={surveyQuestions}
                  surveyId={Number(surveyId)}
                />
              </>
            )}
          </Box>
        }
        sidePane={
          <>
            <Chart
              submissions={submissions}
              selectedQuestion={selectedQuestion}
            />

            <AnswerMap
              survey={survey}
              submissions={submissions}
              selectedQuestion={selectedQuestion}
              onAnswerClick={(answer) => {
                setSelectedAnswer(answer);
              }}
              onSelectQuestion={(question) => setSelectedQuestion(question)}
              selectedAnswer={selectedAnswer}
              surveyQuestions={surveyQuestions}
              questions={questions}
            />
          </>
        }
        mobileDrawer={{
          open: mobileDrawerOpen,
          setOpen: (open) => {
            setMobileDrawerOpen(open);
          },
          chipProps: {
            color: 'secondary',
            icon: <MapIcon />,
            label: tr.SurveyStepper.openMap,
          },
          helperText: null,
          title: null,
        }}
      />
    </>
  );
}
