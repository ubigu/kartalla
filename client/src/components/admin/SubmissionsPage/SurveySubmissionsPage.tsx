import {
  AnswerEntry,
  LanguageCode,
  Submission,
  Survey,
  SurveyQuestion,
} from '@interfaces/survey';
import {
  Box,
  CircularProgress,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { CoreSelect } from '@src/components/core/Select';
import { sectionTypeIcons } from '@src/components/admin/surveySectionIcons';
import Chart from '@src/components/admin/SubmissionsPage/SurveySubmissionsChart';
import MapIcon from '@src/components/icons/MapIcon';
import {
  isAnswerEmpty,
  useSurveyAnswers,
} from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { isSurveyQuestion } from '@src/utils/typeCheck';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminAppBar } from '../AdminAppBar';
import DataExport from '../DataExport';
import DataPublish from '../DataPublish';
import AnswerMap from './AnswerMap';
import AnswersList, { AnswerItem, AnswerSelection } from './AnswersList';
import { AnswerTable } from './AnswerTable';
import { DataChart } from './DataChart';
import SplitPaneLayout from './SplitPaneLayout';
import { SurveyQuestionSummary } from './SurveyQuestionSummary';

const CHART_TYPES: SurveyQuestion['type'][] = [
  'numeric',
  'slider',
  'radio',
  'radio-image',
  'checkbox',
  'budgeting',
];

const MAP_TYPES: SurveyQuestion['type'][] = ['map'];

const DEFAULT_VIEW_SECTION_ID = 0;

function answerEntryToItems(
  submission: Submission,
  entry: AnswerEntry,
): AnswerItem[] {
  // Only split map entries into separate items (one per geometry)
  // Geo-budgeting and other types stay as single items
  if (entry.type !== 'map') {
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
  const [error, setError] = useState<{ status: number } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerSelection | null>(
    null,
  );
  const [refreshSurvey, setRefreshSurvey] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<SurveyQuestion | null>(null);

  const { survey, setSurvey } = useSurveyAnswers();
  const { tr, surveyLanguage, setSurveyLanguage, languages } =
    useTranslations();

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
        setError(error as { status: number });
      }
      setSurveyLoading(false);
    }
    fetchSurvey();

    // cleanup to prevent old survey mixing up with the new one when moving between submission pages
    return () => setSurvey(null);
  }, [name, surveyId]);

  useEffect(() => {
    if (survey?.primaryLanguage) {
      setSurveyLanguage(survey.primaryLanguage as LanguageCode);
    }
  }, [survey?.id]);

  // Fetch submissions from server after the survey has been loaded
  useEffect(() => {
    if (survey == null) {
      return;
    }

    setSubmissionsLoading(true);
    async function fetchSubmissions() {
      const submissionUrl = `/api/surveys/${survey?.id}/submissions?withPersonalInfo=true`;
      try {
        const submissions = await request<Submission[]>(submissionUrl);
        setSubmissions(
          submissions.map((submission) => ({
            ...submission,
            timestamp: new Date(submission.timestamp),
          })),
        );
      } catch (error) {
        setError(error as { status: number });
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
        setError(error as { status: number });
      }
      setResponsesLoading(false);
    }
    fetchResponses();
  }, [survey]);

  // TODO: Could surveyQuestions and questions be combined into a single variable?
  const surveyQuestions = useMemo(() => {
    if (!survey) return [];
    return (survey.pages ?? []).reduce(
      (sections, page) => [...sections, ...page.sections] as SurveyQuestion[],
      [] as SurveyQuestion[],
    );
  }, [survey]);

  // All map type questions across the entire survey
  const questions = useMemo(() => {
    if (!survey) return [];
    return (survey.pages ?? []).reduce(
      (questions, page) => [
        ...questions,
        ...page.sections.filter((section) => isSurveyQuestion(section)),
      ],
      [
        {
          id: DEFAULT_VIEW_SECTION_ID,
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
        ...(submission.answerEntries ?? []).reduce(
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
      : allAnswers?.filter(
          (answer) =>
            answer.entry.sectionId === selectedQuestion.id &&
            !isAnswerEmpty(selectedQuestion, answer.entry.value),
        );
  }, [allAnswers, selectedQuestion]);

  function renderSidePane() {
    if (
      selectedQuestion !== null &&
      CHART_TYPES.includes(selectedQuestion.type)
    ) {
      return (
        <Chart
          submissions={submissions ?? []}
          selectedQuestion={selectedQuestion}
        />
      );
    }
    if (selectedQuestion?.type === 'free-text') {
      return <AnswerTable answers={answers ?? []} />;
    }
    if (
      selectedQuestion === null ||
      MAP_TYPES.includes(selectedQuestion.type) ||
      selectedQuestion.id === DEFAULT_VIEW_SECTION_ID
    ) {
      if (!survey) return false as const;
      return (
        <AnswerMap
          survey={survey}
          submissions={submissions ?? []}
          selectedQuestion={selectedQuestion ?? questions[0]}
          onAnswerClick={(answer) => setSelectedAnswer(answer)}
          onSelectQuestion={(question) => setSelectedQuestion(question)}
          selectedAnswer={selectedAnswer}
          surveyQuestions={surveyQuestions}
          questions={questions}
        />
      );
    }
    return false as const;
  }

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!survey) {
    return null;
  }

  return (
    <>
      <AdminAppBar
        labels={[survey.title[surveyLanguage], tr.AnswersList.answers]}
      />
      <SplitPaneLayout
        height="calc(100vh - 64px)"
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
            <CoreSelect
              id="submissions-question-select"
              label={tr.SurveySection.question}
              value={selectedQuestion?.id ?? 0}
              onChange={(event) => {
                setSelectedAnswer(null);
                setSelectedQuestion(
                  questions.find(
                    (question) => question.id === event.target.value,
                  ) ?? null,
                );
              }}
              sx={(theme) => ({
                height: '44px',
                fontSize: '16px',
                fontWeight: 700,
                color: theme.palette.textSecondary.main,
                '& .MuiSelect-select': {
                  padding: '0 8px',
                  paddingRight: '32px !important',
                },
              })}
            >
              {questions.map((question) => (
                <MenuItem key={question.id} value={question.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {question.type && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                          '& svg': { fontSize: '20px' },
                        }}
                      >
                        {sectionTypeIcons[question.type]}
                      </Box>
                    )}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {question.title[surveyLanguage]}
                    </span>
                  </Box>
                </MenuItem>
              ))}
            </CoreSelect>

            <CoreSelect
              id="submissions-survey-language"
              label={tr.SurveyLanguageMenu.answerLanguage}
              value={surveyLanguage}
              onChange={(e) =>
                setSurveyLanguage(e.target.value as LanguageCode)
              }
              options={languages
                .filter((lang) => survey.enabledLanguages[lang])
                .map((lang) => ({
                  value: lang,
                  label: `${tr.LanguageMenu[lang].toLocaleLowerCase()} (${lang})`,
                }))}
            />

            {!selectedQuestion ||
            selectedQuestion.id === DEFAULT_VIEW_SECTION_ID ? (
              <>
                <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>
                  {tr.SurveySubmissionsPage.answerCount.replace(
                    '{x}',
                    String(submissions?.length ?? 0),
                  )}
                </Typography>
                <DataChart
                  submissions={submissions ?? []}
                  submissionsLoading={submissionsLoading}
                />
                <Stack direction="row" spacing={2}>
                  <DataExport surveyId={survey.id} surveyTitle={survey.title} />
                  {!survey.isArchived && <DataPublish surveyId={survey.id} />}
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
                  answers={answers ?? []}
                  modifyAnswerCallback={() => setRefreshSurvey((prev) => !prev)}
                  submissions={submissions ?? []}
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
        sidePaneStyle={{ overflowY: 'auto' }}
        sidePane={renderSidePane()}
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
