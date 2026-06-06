import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { usePreventUnload } from '@src/hooks/usePreventUnload';
import { hasEnabledLanguages, useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { WorkingLanguageProvider } from '@src/stores/WorkingLanguageContext';
import { useEffect, useState } from 'react';
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import { VisualSeparator } from '../core/VisualSeparator';
import EditSurveyAppearance from './EditSurveyAppearance';
import EditSurveyBasicSettings from './EditSurveyBasicSettings';
import EditSurveyControls from './EditSurveyControls';
import EditSurveyEmail from './EditSurveyEmail';
import EditSurveyHeader from './EditSurveyHeader';
import { EditSurveyLanguages } from './EditSurveyLanguages';
import EditSurveyPage from './EditSurveyPage';
import EditSurveyPermissions from './EditSurveyPermissions';
import EditSurveySideBar from './EditSurveySideBar';
import EditSurveyThanksPage from './EditSurveyThanksPage';
import EditSurveyTranslationsV2 from './EditSurveyTranslationsV2';
import Loader from './Loader';
import { EditSurveyMapData } from './map/EditSurveyMapData';

export const innerContentMaxWidth = '800px';

export const editPageContainerSx = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '36px',
  maxWidth: 'min(55em, 70vw)',
};

export const editSurveyPaths = {
  basicSettings: 'perusasetukset',
  languageSettings: 'kieliasetukset',
  permissions: 'käyttäjäoikeudet',
  appearance: 'ulkoasu',
  mapData: 'kartta-aineistot',
  emails: 'sähköpostit',
  pages: 'sivut',
  thanksPage: 'kiitos-sivu',
  translations: 'käännökset',
} as const;

export default function EditSurvey() {
  const { path, url } = useRouteMatch();
  const { surveyId } = useParams<{ surveyId: string }>();
  const [isEditable, setIsEditable] = useState<boolean | null>(null);
  const {
    fetchSurveyToContext,
    activeSurveyLoading,
    activeSurvey,
    hasActiveSurveyChanged,
  } = useSurvey();

  const { tr, language } = useTranslations();
  const { showToast } = useToasts();
  const history = useHistory();
  const { activeUser, activeUserIsAdmin, activeUserIsSuperUser } = useUser();

  const allowEditing = Boolean(
    !activeSurveyLoading &&
    !activeSurvey?.isArchived &&
    (activeUserIsSuperUser ||
      activeUserIsAdmin ||
      activeUser?.id === activeSurvey?.authorId ||
      (activeUser && activeSurvey.editors.includes(activeUser?.id))),
  );

  usePreventUnload(
    allowEditing && hasActiveSurveyChanged,
    tr.EditSurvey.preventUnloadConfirm,
  );

  useEffect(() => {
    async function fetchSurvey() {
      try {
        await fetchSurveyToContext(Number(surveyId));
      } catch (error) {
        showToast({
          severity: 'error',
          message: tr.EditSurvey.errorFetchingSurvey,
        });
        history.push('/');
        throw error;
      }
    }
    fetchSurvey();
  }, [surveyId]);

  if (!activeSurvey || String(activeSurvey.id) !== surveyId) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeSurveyLoading ? (
          <CircularProgress />
        ) : (
          <Typography variant="body1">
            {tr.EditSurvey.errorFetchingSurvey}
          </Typography>
        )}
      </Box>
    );
  }

  const checkingAnswers =
    path.includes(editSurveyPaths.pages) && isEditable === null;

  return (
    <WorkingLanguageProvider survey={activeSurvey} uiLanguage={language}>
      <EditSurveyHeader />
      <Box
        sx={{
          display: 'flex',
          height: 'calc(min(100svh, 100vh) - 64px)',
          flexDirection: 'row-reverse',
        }}
      >
        <Box
          component="main"
          sx={{
            position: 'relative',
            overflow: 'auto',
            flex: 1,
            p: '24px',
          }}
        >
          <Stack
            sx={{
              gap: '24px',
              width: 'fit-content',
            }}
          >
            <Switch>
              <Route path={`${path}/${editSurveyPaths.basicSettings}`}>
                <EditSurveyBasicSettings canEdit={allowEditing} />
              </Route>
              <Route path={`${path}/${editSurveyPaths.languageSettings}`}>
                <EditSurveyLanguages canEdit={allowEditing} />
              </Route>
              <Route path={`${path}/${editSurveyPaths.permissions}`}>
                <EditSurveyPermissions canEdit={allowEditing} />
              </Route>
              <Route path={`${path}/${editSurveyPaths.appearance}`}>
                <EditSurveyAppearance canEdit={allowEditing} />
              </Route>
              <Route path={`${path}/${editSurveyPaths.mapData}`}>
                <EditSurveyMapData />
              </Route>
              <Route path={`${path}/${editSurveyPaths.emails}`}>
                <EditSurveyEmail />
              </Route>
              <Route path={`${path}/${editSurveyPaths.pages}/:pageId`}>
                {checkingAnswers && (
                  <Loader label={tr.EditSurveyPage.fetchingSubmissions} />
                )}
                <EditSurveyPage
                  canEdit={allowEditing}
                  isEditable={isEditable}
                  onEditableChange={setIsEditable}
                />
              </Route>
              <Route path={`${path}/${editSurveyPaths.thanksPage}`}>
                <EditSurveyThanksPage canEdit={allowEditing} />
              </Route>
              {activeSurvey.localisationEnabled && (
                <Route path={`${path}/${editSurveyPaths.translations}`}>
                  <EditSurveyTranslationsV2 />
                </Route>
              )}
              <Route path="*">
                <Redirect to={`${url}/${editSurveyPaths.basicSettings}`} />
              </Route>
            </Switch>
            {!checkingAnswers && (
              <>
                <VisualSeparator />
                <EditSurveyControls
                  disabled={!allowEditing || !hasEnabledLanguages(activeSurvey)}
                />
              </>
            )}
          </Stack>
        </Box>
        <EditSurveySideBar allowEditing={allowEditing} />
      </Box>
    </WorkingLanguageProvider>
  );
}
