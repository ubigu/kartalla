import { Box, CircularProgress, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { usePreventUnload } from '@src/utils/usePreventUnload';
import { useEffect } from 'react';
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import EditSurveyAppearance from './EditSurveyAppearance';
import EditSurveyBasicSettings from './EditSurveyBasicSettings';
import EditSurveyControls from './EditSurveyControls';
import EditSurveyEmail from './EditSurveyEmail';
import EditSurveyHeader from './EditSurveyHeader';
import EditSurveyMapData from './EditSurveyMapData';
import EditSurveyPage from './EditSurveyPage';
import EditSurveyPermissions from './EditSurveyPermissions';
import EditSurveySideBar from './EditSurveySideBar';
import EditSurveyThanksPage from './EditSurveyThanksPage';
import EditSurveyTranslationsV2 from './EditSurveyTranslationsV2';

export const editPageContainerSx = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '36px',
  minWidth: 'fit-content',
  maxWidth: 'min(55em, 70%)',
};

export default function EditSurvey() {
  const { path, url } = useRouteMatch();
  const { surveyId } = useParams<{ surveyId: string }>();
  const {
    fetchSurveyToContext,
    activeSurveyLoading,
    activeSurvey,
    hasActiveSurveyChanged,
  } = useSurvey();
  const { tr, setSurveyLanguage } = useTranslations();
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

  // Prevent page unload when there are unsaved changes
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

  useEffect(() => {
    if (activeSurvey?.primaryLanguage) {
      setSurveyLanguage(activeSurvey.primaryLanguage);
    }
  }, [activeSurvey?.id]);

  return !activeSurvey || String(activeSurvey.id) !== surveyId ? (
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
  ) : (
    <>
      <EditSurveyHeader />
      <Box
        sx={{
          display: 'flex',
          height: 'calc(min(100svh, 100vh) - 64px)',
          flexDirection: 'row-reverse', // So that h1 header comes before subheaders at dom
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
          <Switch>
            <Route path={`${path}/perusasetukset`}>
              <EditSurveyBasicSettings canEdit={allowEditing} />
            </Route>
            <Route path={`${path}/käyttäjäoikeudet`}>
              <EditSurveyPermissions canEdit={allowEditing} />
            </Route>
            <Route path={`${path}/ulkoasu`}>
              <EditSurveyAppearance canEdit={allowEditing} />
            </Route>
            <Route path={`${path}/kartta-aineistot`}>
              <EditSurveyMapData />
            </Route>
            <Route path={`${path}/sähköpostit`}>
              <EditSurveyEmail />
            </Route>
            <Route path={`${path}/sivut/:pageId`}>
              <EditSurveyPage canEdit={allowEditing} />
            </Route>
            <Route path={`${path}/kiitos-sivu`}>
              <EditSurveyThanksPage canEdit={allowEditing} />
            </Route>
            {activeSurvey.localisationEnabled && (
              <Route path={`${path}/käännökset`}>
                <EditSurveyTranslationsV2 />
              </Route>
            )}
            <Route path="*">
              {/* By default redirect to basic settings */}
              <Redirect to={`${url}/perusasetukset`} />
            </Route>
          </Switch>
          {allowEditing && <EditSurveyControls />}
        </Box>
        <EditSurveySideBar allowEditing={allowEditing} />
      </Box>
    </>
  );
}
