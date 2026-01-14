import { Survey } from '@interfaces/survey';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Link,
  ListItem,
  Stack,
  Theme,
  Typography,
} from '@mui/material';
import CalendarSmallIcon from '@src/components/icons/CalendarSmallIcon';
import LinkSmallIcon from '@src/components/icons/LinkSmallIcon';
import UserSmallIcon from '@src/components/icons/UserSmallIcon';
import {
  archiveSurvey,
  creteSurveyFromPrevious,
  getSurveyPublicationCredentials,
  publishSurvey,
  restoreSurvey,
  unpublishSurvey,
} from '@src/controllers/SurveyController';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';

import { CredentialsEntry } from '@interfaces/submission';
import { theme } from '@src/themes/admin';
import { request } from '@src/utils/request';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';
import ConfirmDialog from '../ConfirmDialog';
import CopyToClipboard from '../CopyToClipboard';
import LoadingButton from '../LoadingButton';

const fadeTimeout = 350;

const cardStyles = (theme: Theme, loading: boolean, published: boolean) => ({
  width: '100%',
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
  ...(loading && {
    animation: `pulse 2s ${theme.transitions.easing.easeIn} infinite`,
    pointerEvents: 'none',
    filter: 'grayscale(100%)',
  }),
  ...(published && {
    borderLeft: 'solid 5px',
    borderLeftColor: theme.palette.primary.main,
  }),
});
interface Props {
  survey: Survey;
  onArchive?: (surveyId: number) => void;
  onRestore?: (surveyId: number) => void;
  onCopyStart?: () => void;
  onCopyEnd?: () => void;
}

export default function SurveyListItem(props: Props) {
  const [fadeRight, setFadeRight] = useState(false);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [survey, setSurvey] = useState(props.survey);
  const [publishConfirmDialogOpen, setPublishConfirmDialogOpen] =
    useState(false);
  const [unpublishConfirmDialogOpen, setUnpublishConfirmDialogOpen] =
    useState(false);
  const [archiveConfirmDialogOpen, setArchiveConfirmDialogOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);

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
    <ListItem
      sx={{
        padding: '8px 0',
        '@keyframes shiftRight': {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            opacity: 0,
            transform: 'translateX(100%)',
          },
        },
        '@keyframes shiftLeft': {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            opacity: 0,
            transform: 'translateX(-100%)',
          },
        },
        animation: fadeRight
          ? `shiftRight ease-in-out ${fadeTimeout}ms`
          : fadeLeft
            ? `shiftLeft ease-in-out ${fadeTimeout}ms`
            : 'none',
      }}
    >
      <Card sx={cardStyles(theme, loading, survey.isPublished)}>
        <CardContent sx={{ paddingBottom: '8px' }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
            {!survey.title?.[surveyLanguage] ? (
              <em>{tr.SurveyList.untitledSurvey}</em>
            ) : (
              (survey?.title?.[surveyLanguage] ?? '')
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
            {!survey.isArchived &&
            (activeUserIsSuperUser ||
              activeUserIsAdmin ||
              survey.editors.includes(activeUser?.id) ||
              activeUser?.id === survey.authorId)
              ? tr.SurveyList.editSurvey
              : tr.SurveyList.viewSurvey}
          </Button>
          {/* Allow publish only if it isn't yet published, has a name, and is not archived */}
          {!survey.isPublished && survey.name && !survey.isArchived && (
            <Button
              disabled={disableUsersWriteAccessToSurvey}
              onClick={() => {
                setPublishConfirmDialogOpen(true);
              }}
            >
              {tr.SurveyList.publishNow}
            </Button>
          )}
          {/* Allow unpublish when survey is published and is not archived */}
          {survey.isPublished && !survey.isArchived && (
            <Button
              disabled={disableUsersWriteAccessToSurvey}
              onClick={() => {
                setUnpublishConfirmDialogOpen(true);
              }}
            >
              {tr.SurveyList.unpublish}
            </Button>
          )}
          <Button
            disabled={disableUsersViewAccessToSurvey}
            onClick={async () => {
              props.onCopyStart?.();
              const newSurveyId = await creteSurveyFromPrevious(survey.id);
              if (!newSurveyId) return;
              props.onCopyEnd?.();
              window.open(`/admin/kyselyt/${newSurveyId}`);
            }}
          >
            {' '}
            {tr.SurveyList.copySurvey}{' '}
          </Button>

          {(activeUserIsSuperUser ||
            activeUserIsAdmin ||
            survey.editors.includes(activeUser?.id) ||
            activeUser?.id === survey.authorId) && (
            <LoadingButton
              onClick={async () => {
                if (survey.isArchived) {
                  try {
                    await restoreSurvey(survey);
                    setFadeLeft(true);

                    setTimeout(() => {
                      props.onRestore?.(survey.id);
                      showToast({
                        severity: 'success',
                        message: tr.SurveyList.restoreSuccessful,
                      });
                    }, fadeTimeout);
                  } catch (error) {
                    showToast({
                      severity: 'error',
                      message: tr.SurveyList.restoreFailed,
                    });
                  }
                } else {
                  setArchiveConfirmDialogOpen(true);
                }
              }}
            >
              {survey.isArchived
                ? tr.SurveyList.restore
                : tr.SurveyList.archive}
            </LoadingButton>
          )}
          <Button
            disabled={
              disableUsersViewAccessToSurvey || survey?.submissionCount === 0
            }
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
      <ConfirmDialog
        open={archiveConfirmDialogOpen}
        submitColor="primary"
        title={survey.title?.[surveyLanguage] ?? ''}
        text={tr.SurveyList.archiveDialogContent}
        onClose={async (result) => {
          setArchiveConfirmDialogOpen(false);
          if (!result) {
            return;
          }
          try {
            const publicationCredentials =
              await getSurveyPublicationCredentials(props.survey.id);
            if (publicationCredentials.length > 0) {
              await request<CredentialsEntry>(
                `/api/surveys/${props.survey.id}/publication/credentials`,
                {
                  method: 'DELETE',
                },
              );
            }
            await archiveSurvey(survey);
            setFadeRight(true);
            setTimeout(() => {
              props.onArchive?.(survey.id);
              showToast({
                severity: 'success',
                message: tr.SurveyList.archiveSuccessful,
              });
            }, fadeTimeout);
          } catch (error) {
            showToast({
              severity: 'error',
              message: tr.SurveyList.archiveFailed,
            });
          }
        }}
      />
    </ListItem>
  );
}
