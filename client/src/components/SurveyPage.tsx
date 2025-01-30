import { Survey } from '@interfaces/survey';
import { Box, CircularProgress } from '@mui/material';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useSurveyTheme } from '@src/stores/SurveyThemeProvider';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';
import SurveyLandingPage from './SurveyLandingPage';
import SurveyLanguageMenu from './SurveyLanguageMenu';
import SurveyStepper from './SurveyStepper';
import SurveyThanksPage from './SurveyThanksPage';
import TestSurveyFrame from './TestSurveyFrame';
import { UnavailableSurvey } from './UnavailableSurvey';

interface Props {
  isTestSurvey?: boolean;
}

export default function SurveyPage({ isTestSurvey }: Props) {
  const [loading, setLoading] = useState(true);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showThanksPage, setShowThanksPage] = useState(false);
  const [surveyBackgroundImage, setSurveyBackgroundImage] = useState<{
    attributions: string;
  }>(null);
  const [errorStatusCode, setErrorStatusCode] = useState<number>(null);
  const [continueUnfinished, setContinueUnfinished] = useState(false);

  const { name, organization } = useParams<{
    name: string;
    organization: string;
  }>();
  const { setSurvey, survey, loadUnfinishedEntries } = useSurveyAnswers();
  const { setThemeFromSurvey } = useSurveyTheme();
  const { search } = useLocation();
  const { tr, language, setAvailableLanguages } = useTranslations();
  const { showToast } = useToasts();

  const unfinishedToken = useMemo(
    () => new URLSearchParams(search)?.get('token'),
    [search],
  );

  // Fetch survey data from server
  useEffect(() => {
    async function fetchSurvey() {
      try {
        const survey = await request<Survey>(
          `/api/published-surveys/${organization}/${name}${
            isTestSurvey ? '?test=true' : ''
          }`,
        );
        if (survey.backgroundImageUrl) {
          const response = await fetch(
            `/api/file/${survey.backgroundImageUrl}`,
          );
          const details = JSON.parse(
            response.headers.get('File-details') ?? '{}',
          );
          setSurveyBackgroundImage(details);
        }
        setSurvey(survey);
        setThemeFromSurvey(survey);
        setLoading(false);
        setAvailableLanguages(survey.enabledLanguages);
      } catch (error) {
        setErrorStatusCode(error.status);
        setLoading(false);
        throw error;
      }
    }
    fetchSurvey();
  }, [name]);

  // Update page title from survey data
  useEffect(() => {
    if (!survey) {
      return;
    }
    document.title = [survey.title?.[language], survey.subtitle?.[language]]
      .filter(Boolean)
      .join(' - ');
  }, [survey]);

  // Try to continue unfinished submission if an unfinished token is provided in query parameters
  useEffect(() => {
    if (!survey || !unfinishedToken) {
      return;
    }
    async function continueSubmission() {
      try {
        await loadUnfinishedEntries(unfinishedToken);
        showToast({
          message: tr.SurveyPage.loadUnfinishedSuccessful,
          severity: 'success',
        });
        setContinueUnfinished(true);
      } catch (error) {
        switch (error.status) {
          case 400:
          case 404:
            showToast({
              message: tr.SurveyPage.errorTokenNotFound,
              severity: 'error',
            });
            break;
          default:
            showToast({
              message: tr.SurveyPage.errorLoadingUnfinished,
              severity: 'error',
            });
        }
      }
    }
    continueSubmission();
  }, [survey, unfinishedToken]);

  return !survey ? (
    loading ? (
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
    ) : errorStatusCode === 404 ? (
      <NotFoundPage />
    ) : (
      <UnavailableSurvey />
    )
  ) : (
    <>
      <Box
        sx={{
          height: '100vh',
          maxHeight: '-webkit-fill-available',
        }}
      >
        {(showLandingPage || showThanksPage) &&
          survey.localisationEnabled &&
          Object.values(survey.enabledLanguages).filter(
            (langEnabled) => langEnabled,
          ).length > 1 && (
            <SurveyLanguageMenu
              changeUILanguage={true}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(7px)',
                padding: '0.2rem 1rem 0.2rem 0.2rem',
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                zIndex: 10,
                borderRadius: '7px',
              }}
            />
          )}
        {/* Landing page */}
        {showLandingPage && (
          <SurveyLandingPage
            survey={survey}
            isTestSurvey={isTestSurvey}
            continueUnfinished={continueUnfinished}
            surveyBackgroundImage={surveyBackgroundImage}
            onStart={() => {
              setShowLandingPage(false);
            }}
          />
        )}
        {/* Survey page */}
        {!showLandingPage && !showThanksPage && (
          <SurveyStepper
            survey={survey}
            isTestSurvey={isTestSurvey}
            onComplete={() => {
              setShowThanksPage(true);
            }}
          />
        )}
        {/* Thanks page */}
        {!showLandingPage && showThanksPage && (
          <SurveyThanksPage survey={survey} isTestSurvey={isTestSurvey} />
        )}
      </Box>
      {isTestSurvey && <TestSurveyFrame />}
    </>
  );
}
