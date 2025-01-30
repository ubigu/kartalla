import { Survey } from '@interfaces/survey';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Link,
  Stack,
  Theme,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import CalendarSmallIcon from '@src/components/icons/CalendarSmallIcon';
import LinkSmallIcon from '@src/components/icons/LinkSmallIcon';
import UserSmallIcon from '@src/components/icons/UserSmallIcon';
import {
  creteSurveyFromPrevious,
  publishSurvey,
  unpublishSurvey,
} from '@src/controllers/SurveyController';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import clsx from 'clsx';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';
import ConfirmDialog from '../ConfirmDialog';
import CopyToClipboard from '../CopyToClipboard';
import LoadingButton from '../LoadingButton';

const useStyles = makeStyles((theme: Theme) => ({
  '@keyframes pulse': {
    '0%': {
      opacity: 0.4,
    },
    '50%': {
      opacity: 0.7,
    },
    '100%': {
      opacity: 0.4,
    },
  },
  loading: {
    animation: `$pulse 1s ${theme.transitions.easing.easeIn} infinite`,
    pointerEvents: 'none',
    filter: 'grayscale(100%)',
  },
  cardRoot: {
    paddingBottom: '8px',
  },
  publishedCard: {
    borderLeft: 'solid 5px',
    borderLeftColor: theme.palette.primary.main,
  },
}));

interface Props {
  survey: Survey;
}

export default function SurveyListItem(props: Props) {
  const [survey, setSurvey] = useState(props.survey);
  const [publishConfirmDialogOpen, setPublishConfirmDialogOpen] =
    useState(false);
  const [unpublishConfirmDialogOpen, setUnpublishConfirmDialogOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const classes = useStyles();
  const { tr, surveyLanguage } = useTranslations();
  const { showToast } = useToasts();
  const { url } = useRouteMatch();
  const { activeUser, activeUserIsAdmin, activeUserIsSuperUser } = useUser();

  const disableUsersViewAccessToSurvey = useMemo(
    () =>
      !(activeUserIsAdmin || activeUserIsSuperUser) &&
      activeUser?.id !== survey.authorId &&
      !survey.editors.includes(activeUser?.id) &&
      !survey.viewers.includes(activeUser?.id),

    [activeUser, survey],
  );

  const disableUsersWriteAccessToSurvey = useMemo(
    () =>
      !(activeUserIsAdmin || activeUserIsSuperUser) &&
      activeUser?.id !== survey.authorId &&
      !survey.editors.includes(activeUser?.id),
    [activeUser, survey],
  );

  const surveyUrl = useMemo(() => {
    if (!survey.name) {
      return null;
    }
    return `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? `:${window.location.port}` : ''
    }/${survey.organization.name}/${survey.name}`;
  }, [survey.name]);

  return (
    <li style={{ marginBottom: '20px' }}>
      <Card
        className={clsx(
          loading && classes.loading,
          survey.isPublished && classes.publishedCard,
        )}
      >
        <CardContent classes={{ root: classes.cardRoot }}>
          <Typography variant="h6" component="h3">
            {!survey.title?.[surveyLanguage] ? (
              <em>{tr.SurveyList.untitledSurvey}</em>
            ) : (
              survey?.title?.[surveyLanguage] ?? ''
            )}
          </Typography>
          <Typography color="textSecondary" component="h4" gutterBottom>
            {survey.subtitle?.[surveyLanguage]}
          </Typography>
          <Box display="flex" rowGap={1} columnGap={1} flexWrap="wrap">
            {survey.tags.map((tag, i) => (
              <Chip label={tag} key={i} />
            ))}
          </Box>
          <Stack direction="row">
            <div>
              <LinkSmallIcon
                color="primary"
                fontSize="small"
                sx={{ marginTop: 1, marginRight: 1 }}
              />
            </div>
            {surveyUrl && (
              <Typography variant="body1" color="textSecondary" gutterBottom>
                <Link
                  href={`${surveyUrl}${
                    survey.localisationEnabled ? '?lang=' + surveyLanguage : ''
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`${surveyUrl}${
                    survey.localisationEnabled ? '?lang=' + surveyLanguage : ''
                  }`}
                </Link>
                <CopyToClipboard
                  data={`${surveyUrl}${
                    survey.localisationEnabled ? '?lang=' + surveyLanguage : ''
                  }`}
                />
              </Typography>
            )}
          </Stack>
          <Stack direction="row">
            <div>
              <UserSmallIcon
                color="primary"
                fontSize="small"
                sx={{ marginTop: 0, marginRight: 1 }}
              />
            </div>
            <Typography
              variant="body1"
              fontSize="bigger"
              color="textSecondary"
              gutterBottom
            >
              {survey.author}
              {survey.authorUnit && `, ${survey.authorUnit}`}
            </Typography>
          </Stack>

          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Scheduling info (start/end dates) */}
            <CalendarSmallIcon
              fontSize="small"
              color="primary"
              sx={{ marginRight: 1 }}
            />
            {survey.startDate && survey.endDate ? (
              <Typography variant="body1" color="primary" gutterBottom>
                {tr.SurveyList.open} {format(survey.startDate, 'd.M.yyyy')} -{' '}
                {format(survey.endDate, 'd.M.yyyy')}
              </Typography>
            ) : survey.startDate ? (
              <Typography variant="body1" color="primary" gutterBottom>
                {tr.SurveyList.openFrom} {format(survey.startDate, 'd.M.yyyy')}
              </Typography>
            ) : null}
            {/* Current publish status */}
            {survey.isPublished ? (
              <Typography
                variant="published"
                color="primary"
                style={{ paddingLeft: '0.5rem' }}
              >
                {' '}
                - {tr.SurveyList.published}
              </Typography>
            ) : (
              <Typography
                variant="published"
                color="primary"
                style={{ paddingLeft: '0.5rem' }}
              >
                {' '}
                - {tr.SurveyList.notPublished}
              </Typography>
            )}
          </div>
        </CardContent>
        <CardActions
          style={{
            paddingTop: '0',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <Button
            component={NavLink}
            to={`${url}kyselyt/${survey.id}`}
            disabled={disableUsersViewAccessToSurvey}
          >
            {activeUserIsSuperUser ||
            activeUserIsAdmin ||
            survey.editors.includes(activeUser?.id) ||
            activeUser?.id === survey.authorId
              ? tr.SurveyList.editSurvey
              : tr.SurveyList.viewSurvey}
          </Button>
          {/* Allow publish only if it isn't yet published and has a name */}
          {!survey.isPublished && survey.name && (
            <Button
              disabled={disableUsersWriteAccessToSurvey}
              onClick={() => {
                setPublishConfirmDialogOpen(true);
              }}
            >
              {tr.SurveyList.publishNow}
            </Button>
          )}
          {/* Allow unpublish when survey is published */}
          {survey.isPublished && (
            <Button
              disabled={disableUsersWriteAccessToSurvey}
              onClick={() => {
                setUnpublishConfirmDialogOpen(true);
              }}
            >
              {tr.SurveyList.unpublish}
            </Button>
          )}
          <LoadingButton
            disabled={disableUsersViewAccessToSurvey}
            onClick={async () => {
              const newSurveyId = await creteSurveyFromPrevious(survey.id);
              if (!newSurveyId) return;
              window.open(`/admin/kyselyt/${newSurveyId}`);
            }}
          >
            {' '}
            {tr.SurveyList.copySurvey}{' '}
          </LoadingButton>
          <Button
            disabled={disableUsersViewAccessToSurvey}
            component={NavLink}
            style={{ marginLeft: 'auto' }}
            variant="contained"
            to={`vastaukset/${survey.id}`}
          >
            {`${tr.SurveyList.answers} (${survey?.submissionCount ?? 0})`}
          </Button>
        </CardActions>
      </Card>
      <ConfirmDialog
        open={publishConfirmDialogOpen}
        submitColor="primary"
        title={survey.title?.[surveyLanguage] ?? ''}
        text={tr.SurveyList.confirmPublish}
        onClose={async (result) => {
          setPublishConfirmDialogOpen(false);
          if (!result) {
            return;
          }
          setLoading(true);
          try {
            const updatedSurvey = await publishSurvey(survey);
            setSurvey({
              ...updatedSurvey,
              submissionCount: survey.submissionCount,
            });
            showToast({
              severity: 'success',
              message: tr.SurveyList.publishSuccessful,
            });
          } catch (error) {
            showToast({
              severity: 'error',
              message: tr.SurveyList.publishFailed,
            });
          }
          setLoading(false);
        }}
      />
      <ConfirmDialog
        open={unpublishConfirmDialogOpen}
        submitColor="error"
        title={survey.title?.[surveyLanguage] ?? ''}
        text={tr.SurveyList.confirmUnpublish}
        onClose={async (result) => {
          setUnpublishConfirmDialogOpen(false);
          if (!result) {
            return;
          }
          setLoading(true);
          try {
            const updatedSurvey = await unpublishSurvey(survey);
            setSurvey({
              ...updatedSurvey,
              submissionCount: survey.submissionCount,
            });
            showToast({
              severity: 'success',
              message: tr.SurveyList.unpublishSuccessful,
            });
          } catch (error) {
            showToast({
              severity: 'error',
              message: tr.SurveyList.unpublishFailed,
            });
          }
          setLoading(false);
        }}
      />
    </li>
  );
}
