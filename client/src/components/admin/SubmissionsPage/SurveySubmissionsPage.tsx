import {
  Submission,
  SubmissionAnswerEntry,
  Survey,
  SurveyQuestion,
} from '@interfaces/survey';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import Chart from '@src/components/admin/SubmissionsPage/SurveySubmissionsChart';
import { sectionTypeIcons } from '@src/components/admin/surveySectionIcons';
import { Combobox_WIP } from '@src/components/core/Combobox';
import { Select } from '@src/components/core/Select';
import MapIcon from '@src/components/icons/MapIcon';
import {
  isAnswerEmpty,
  useSurveyAnswers,
} from '@src/stores/SurveyAnswerContext';
import { Language, useTranslations } from '@src/stores/TranslationContext';
import {
  WorkingLanguageProvider,
  useWorkingLanguage,
} from '@src/stores/WorkingLanguageContext';
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

const MAP_TYPES: SurveyQuestion['type'][] = ['map', 'geo-budgeting'];

const DEFAULT_VIEW_SECTION_ID = 0;

function answerEntryToItems(
  submission: Submission,
  entry: SubmissionAnswerEntry,
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
  const [surveyLoading, setSurveyLoading] = useState(true);

  const { survey, setSurvey } = useSurveyAnswers();
  const { tr, language } = useTranslations();

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

  if (surveyLoading) {
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
    <WorkingLanguageProvider survey={survey} uiLanguage={language}>
      <SurveySubmissionsContent survey={survey} />
    </WorkingLanguageProvider>
  );
}

function SurveySubmissionsContent({ survey }: { survey: Survey }) {
  const { surveyId } = useParams<{ name: string; surveyId: string }>();
  const [error, setError] = useState<{ status: number } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [responsesLoading, setResponsesLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerSelection | null>(
    null,
  );
  const [refreshSurvey, setRefreshSurvey] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<SurveyQuestion | null>(null);

  const { tr } = useTranslations();
  const { workingLanguage, setWorkingLanguage } = useWorkingLanguage();

  const loading = useMemo(() => {
    return submissionsLoading || responsesLoading;
  }, [submissionsLoading, responsesLoading]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }
    if (error.status === 404) {
      return tr.SurveyPage.errorSurveyNotFound;
    }
    return tr.SurveyPage.errorFetchingSurvey;
  }, [error]);

  // Fetch submissions from server after the survey has been loaded
  useEffect(() => {
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
        setError(error as { status: number });
      }
      setSubmissionsLoading(false);
    }
    fetchSubmissions();
  }, [survey, refreshSurvey]);

  // Fetch submission/answer responses after the survey has been loaded
  useEffect(() => {
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
    return (survey.pages ?? []).reduce(
      (sections, page) => [...sections, ...page.sections] as SurveyQuestion[],
      [] as SurveyQuestion[],
    );
  }, [survey]);

  // All map type questions across the entire survey
  const questions = useMemo(() => {
    return (survey.pages ?? []).reduce(
      (questions, page) => [
        ...questions,
        ...page.sections.filter((section) => isSurveyQuestion(section)),
      ],
      [
        {
          id: DEFAULT_VIEW_SECTION_ID,
          title: { [workingLanguage]: tr.SurveySubmissionsPage.summary },
        },
      ] as SurveyQuestion[],
    );
  }, [survey, workingLanguage]);

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

  return (
    <>
      <AdminAppBar
        labels={[
          survey.title[workingLanguage],
          tr.AnswersList.answers.toLocaleLowerCase(),
        ]}
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
            <Combobox_WIP
              id="submissions-question-select"
              label={tr.SurveySection.question}
              value={String(selectedQuestion?.id ?? 0)}
              onChange={(value) => {
                setSelectedAnswer(null);
                setSelectedQuestion(
                  questions.find((question) => question.id === Number(value)) ??
                    null,
                );
              }}
              sx={(theme) => ({
                height: '44px',
                fontSize: '16px',
                fontWeight: 700,
                color: theme.palette.textSecondary.main,
              })}
              options={questions.map((question) => ({
                value: String(question.id),
                label: question.title[workingLanguage],
              }))}
              renderValue={(opt) => {
                const question = questions.find(
                  (q) => String(q.id) === opt.value,
                );
                if (!question) return null;
                return (
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
                      {question.title[workingLanguage]}
                    </span>
                  </Box>
                );
              }}
            />

            <Select
              id="submissions-survey-language"
              label={tr.SurveyLanguageMenu.answerLanguage}
              value={workingLanguage}
              onChange={(value) => setWorkingLanguage(value as Language)}
              options={(
                Object.entries(survey.enabledLanguages)
                  .filter(([, enabled]) => enabled)
                  .map(([lang]) => lang) as Language[]
              ).map((lang) => ({
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
                  <DataExport surveyId={survey.id} surveyName={survey.name} />
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
