import { Box, CircularProgress, Toolbar, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { usePreventUnload } from '@src/utils/usePreventUnload';
import { useEffect, useState } from 'react';
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import EditSurveyControls from './EditSurveyControls';
import EditSurveyEmail from './EditSurveyEmail';
import EditSurveyHeader from './EditSurveyHeader';
import EditSurveyInfo from './EditSurveyInfo';
import EditSurveyPage from './EditSurveyPage';
import EditSurveySideBar from './EditSurveySideBar';
import EditSurveyThanksPage from './EditSurveyThanksPage';
import EditSurveyTranslations from './EditSurveyTranslations';

const sideBarWidth = 320;

export default function EditSurvey() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { path, url } = useRouteMatch();
  const { surveyId } = useParams<{ surveyId: string }>();
  const {
    fetchSurveyToContext,
    activeSurveyLoading,
    activeSurvey,
    hasActiveSurveyChanged,
  } = useSurvey();
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const history = useHistory();
  const { activeUser, activeUserIsAdmin, activeUserIsSuperUser } = useUser();

  const allowEditing =
    !activeSurveyLoading &&
    !activeSurvey?.isArchived &&
    (activeUserIsSuperUser ||
      activeUserIsAdmin ||
      activeUser?.id === activeSurvey?.authorId ||
      activeSurvey.editors.includes(activeUser?.id));

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
    <Box sx={{ display: 'flex' }}>
      <EditSurveyHeader
        sideBarWidth={sideBarWidth}
        onDrawerToggle={() => {
          setMobileOpen(!mobileOpen);
        }}
      />
      <EditSurveySideBar
        width={sideBarWidth}
        mobileOpen={mobileOpen}
        onDrawerToggle={() => {
          setMobileOpen(!mobileOpen);
        }}
        allowEditing={allowEditing}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          maxWidth: 'min(55em, 60%)',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <Toolbar />
        <Switch>
          <Route path={`${path}/perustiedot`}>
            <EditSurveyInfo canEdit={allowEditing} />
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
          <Route path={`${path}/käännökset`}>
            <EditSurveyTranslations />
          </Route>
          <Route path="*">
            {/* By default redirect to info page */}
            <Redirect to={`${url}/perustiedot`} />
          </Route>
        </Switch>
        {allowEditing && <EditSurveyControls />}
      </Box>
    </Box>
  );
}
