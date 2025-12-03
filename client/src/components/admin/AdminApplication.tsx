import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ClipboardProvider from '@src/stores/ClipboardContext';
import GeneralNotificationProvider from '@src/stores/GeneralNotificationContext';
import SurveyAnswerProvider from '@src/stores/SurveyAnswerContext';
import SurveyProvider from '@src/stores/SurveyContext';
import SurveyMapProvider from '@src/stores/SurveyMapContext';
import ToastProvider from '@src/stores/ToastContext';
import TranslationProvider from '@src/stores/TranslationContext';
import UserProvider from '@src/stores/UserContext';
import { theme } from '@src/themes/admin';
import fiLocale from 'date-fns/locale/fi';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import Compose from '../Compose';
import LanguageRouter from '../LanguageRouter';
import AdminFrontPage from './AdminFrontPage';
import EditSurvey from './EditSurvey';
import { GeneralNotifications } from './GeneralNotification';
import { ApiInstructions } from './Instructions/ApiDescription';
import { ProtectedRoute } from './ProtectedRoute';
import SurveySubmissionsPage from './SubmissionsPage/SurveySubmissionsPage';
import { UserManagement } from './UserManagement';

export default function AdminApplication() {
  return (
    <Compose
      components={[
        [
          LocalizationProvider,
          { dateAdapter: AdapterDateFns, adapterLocale: fiLocale },
        ],
        [ThemeProvider, { theme }],
        SurveyProvider,
        TranslationProvider,
        ToastProvider,
        ClipboardProvider,
        SurveyAnswerProvider,
        SurveyMapProvider,
        UserProvider,
        GeneralNotificationProvider,
      ]}
    >
      <CssBaseline />
      <BrowserRouter basename="/admin">
        <LanguageRouter />
        <Switch>
          <Route path="/kyselyt/:surveyId">
            <EditSurvey />
          </Route>
          <Route path="/vastaukset/:surveyId">
            <SurveySubmissionsPage />
          </Route>
          <Route path="/rajapintakuvaus">
            <ApiInstructions />
          </Route>
          <ProtectedRoute path="/kayttajahallinta">
            <UserManagement />
          </ProtectedRoute>
          <Route path="/tiedotteet">
            <GeneralNotifications />
          </Route>
          <Route path="/" exact>
            <AdminFrontPage />
          </Route>
          <Route path="*">
            <Redirect to="/" />
          </Route>
        </Switch>
      </BrowserRouter>
    </Compose>
  );
}
