// @ts-strict-ignore
import { EnabledLanguages, Survey } from '@interfaces/survey';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
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
import {
  isLanguage,
  Language,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';

import { CredentialsEntry } from '@interfaces/submission';
import { theme } from '@src/themes/admin';
import { getPublicSurveyUrl } from '@src/utils/path';
import { request } from '@src/utils/request';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';
import ConfirmDialog from '../ConfirmDialog';
import CopyToClipboard from '../CopyToClipboard';
import LoadingButton from '../LoadingButton';
import { Chip } from '../core/Chip';
import BlockIcon from '../icons/BlockIcon';
import CheckIcon from '../icons/CheckIcon';
import CopyPlusIcon from '../icons/CopyPlusIcon';
import FolderIcon from '../icons/FolderIcon';
import SettingsIcon from '../icons/SettingsIcon';

const fadeTimeout = 350;
const CARD_BORDER_RADIUS = '8px';

function BarberPoleBorder({ published }: { published: boolean }) {
  return (
    <Box
      sx={{
        alignSelf: 'stretch',
        width: '8px',
        borderRadius: CARD_BORDER_RADIUS,
        margin: '6px',
        border: '0.5px solid var rgba(233, 236, 239, 1))',
        boxShadow: '1px 1px 2.5px 0px rgba(0, 0, 0, 0.23) inset',
        ...(published
          ? {
              background: `repeating-linear-gradient(
                -45deg,
                ${theme.palette.primary.main},
                ${theme.palette.primary.main} 32px,
                ${theme.palette.primary.light} 32px,
                ${theme.palette.primary.light} 64px
              )`,
              backgroundSize: '100% 90.5px',
              '@keyframes barberPole': {
                '0%': { backgroundPosition: '0 0' },
                '100%': { backgroundPosition: '0 90.5px' },
              },
              animation: 'barberPole 3s linear infinite',
            }
          : {
              backgroundColor: '#F6F8FA',
            }),
      }}
    />
  );
}

const cardStyles = (theme: Theme, loading: boolean) => ({
  borderRadius: CARD_BORDER_RADIUS,
  display: 'flex',
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
});

function getTranslationLanguage(
  uiLang: Language,
  enabledSurveyLanguages: string[],
) {
  if (
    enabledSurveyLanguages.includes(uiLang) ||
    enabledSurveyLanguages.length === 0
  )
    return uiLang;
  return isLanguage(enabledSurveyLanguages[0])
    ? enabledSurveyLanguages[0]
    : uiLang;
}

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

  const { tr, language } = useTranslations();
  const surveyLanguage = getTranslationLanguage(
    language,
    Object.keys(survey.enabledLanguages).filter(
      (lang) => survey.enabledLanguages[lang as keyof EnabledLanguages],
    ),
  );
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

  const surveyUrl = useMemo(
    () => getPublicSurveyUrl(survey.organization.name, survey.name),
    [survey.name],
  );

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
      <Card sx={cardStyles(theme, loading)}>
        <BarberPoleBorder published={survey.isPublished} />
        <Box flex={1}>
          <CardContent sx={{ paddingX: '8px', paddingY: '16px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                {!survey.title?.[surveyLanguage] ? (
                  <em>{tr.SurveyList.untitledSurvey}</em>
                ) : (
                  (survey?.title?.[surveyLanguage] ?? '')
                )}
              </Typography>
              <Box
                sx={{ display: 'flex', gap: '2px', listStyle: 'none' }}
                component={'ul'}
              >
                {Object.keys(survey.enabledLanguages)
                  .filter(
                    (lang) =>
                      survey.enabledLanguages[lang as keyof EnabledLanguages],
                  )
                  .map((lang) => (
                    <Box key={lang} component={'li'}>
                      <Chip
                        label={lang}
                        sx={{
                          height: '28px',
                          width: '28px',
                          borderRadius: '50%',
                        }}
                      />
                    </Box>
                  ))}
              </Box>
            </Box>
            {survey.subtitle?.[surveyLanguage] && (
              <Typography
                fontSize={'1.15rem'}
                color="textSecondary.main"
                component="p"
              >
                {survey.subtitle?.[surveyLanguage]}
              </Typography>
            )}
            {survey.tags.length > 0 && (
              <Box
                rowGap={1}
                columnGap={1}
                sx={{ marginTop: '8px', flexWrap: 'wrap', display: 'flex' }}
              >
                {survey.tags.map((tag, i) => (
                  <Chip label={tag} key={i} />
                ))}
              </Box>
            )}
            <Stack sx={{ gap: '4px' }}>
              <Stack
                sx={{
                  flexDirection: 'row',
                  marginTop: '8px',
                  '& p': { fontSize: '0.875rem' },
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <LinkSmallIcon
                  color="primary"
                  fontSize="small"
                  sx={{ fontSize: '14px' }}
                />
                {surveyUrl && (
                  <Typography variant="body1" color="textSecondary.main">
                    <Link
                      href={`${surveyUrl}${
                        survey.localisationEnabled
                          ? '?lang=' + surveyLanguage
                          : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {`${surveyUrl}${
                        survey.localisationEnabled
                          ? '?lang=' + surveyLanguage
                          : ''
                      }`}
                    </Link>
                    <CopyToClipboard
                      sx={{
                        '& svg': {
                          fontSize: '14px',
                        },
                      }}
                      data={`${surveyUrl}${
                        survey.localisationEnabled
                          ? '?lang=' + surveyLanguage
                          : ''
                      }`}
                    />
                  </Typography>
                )}
              </Stack>
              <Stack
                direction="row"
                sx={{
                  '& p': { fontSize: '0.875rem' },
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <UserSmallIcon
                  color="primary"
                  fontSize="small"
                  sx={{ fontSize: '14px' }}
                />
                <Typography
                  variant="body1"
                  fontSize="bigger"
                  color="textSecondary"
                >
                  {survey.author}
                  {survey.authorUnit && `, ${survey.authorUnit}`}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                sx={{
                  '& p': { fontSize: '0.875rem' },
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                {/* Scheduling info (start/end dates) */}
                <CalendarSmallIcon
                  fontSize="small"
                  color="primary"
                  sx={{ fontSize: '14px' }}
                />
                {survey.startDate && survey.endDate ? (
                  <Typography>
                    {tr.SurveyList.open} {format(survey.startDate, 'd.M.yyyy')}{' '}
                    - {format(survey.endDate, 'd.M.yyyy')}
                  </Typography>
                ) : survey.startDate ? (
                  <Typography>
                    {tr.SurveyList.openFrom}{' '}
                    {format(survey.startDate, 'd.M.yyyy')}
                  </Typography>
                ) : null}
                {/* Current publish status */}
                {survey.isPublished ? (
                  <Typography
                    variant="published"
                    color={'textInteractive'}
                    sx={{
                      fontSize: '0.875rem',
                    }}
                  >
                    {' '}
                    - {tr.SurveyList.published}
                  </Typography>
                ) : (
                  <Typography
                    variant="published"
                    color={'textInteractive'}
                    sx={{
                      fontSize: '0.875rem',
                    }}
                  >
                    {' '}
                    - {tr.SurveyList.notPublished}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </CardContent>
          <CardActions
            style={{
              paddingTop: '0',
              paddingBottom: '14px',
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
            }}
          >
            <Button
              startIcon={<SettingsIcon stroke="currentColor" />}
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
                startIcon={<CheckIcon />}
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
                startIcon={<BlockIcon />}
                disabled={disableUsersWriteAccessToSurvey}
                onClick={() => {
                  setUnpublishConfirmDialogOpen(true);
                }}
              >
                {tr.SurveyList.unpublish}
              </Button>
            )}
            <Button
              startIcon={<CopyPlusIcon />}
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
              {tr.SurveyList.duplicateSurvey}{' '}
            </Button>

            {(activeUserIsSuperUser ||
              activeUserIsAdmin ||
              survey.editors.includes(activeUser?.id) ||
              activeUser?.id === survey.authorId) && (
              <LoadingButton
                startIcon={<FolderIcon />}
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
              style={{ marginLeft: 'auto' }}
              disabled={
                disableUsersViewAccessToSurvey || survey?.submissionCount === 0
              }
              component={NavLink}
              variant="contained"
              to={`vastaukset/${survey.id}`}
            >
              {`${tr.SurveyList.answers} (${survey?.submissionCount ?? 0})`}
            </Button>
          </CardActions>
        </Box>
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
