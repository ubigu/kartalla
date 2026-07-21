// @ts-strict-ignore
import {
  Box,
  Collapse,
  Link,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TagPicker } from '@src/components/admin/TagPicker';
import { hasEnabledLanguages, useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  useWorkingLanguage,
  useWorkingLanguageInlineDescription,
} from '@src/stores/WorkingLanguageContext';
import { getPublicSurveyUrl } from '@src/utils/path';
import { assertNever } from '@src/utils/typeCheck';
import enLocale from 'date-fns/locale/en-GB';
import fiLocale from 'date-fns/locale/fi';
import svLocale from 'date-fns/locale/sv';
import { useMemo, useState } from 'react';
import { NavLink, useHistory, useRouteMatch } from 'react-router-dom';
import CopyToClipboard from '../CopyToClipboard';
import DeleteSurveyDialog from '../DeleteSurveyDialog';
import LoadingButton from '../LoadingButton';
import RichTextEditor from '../RichTextEditor';
import { Checkbox } from '../core/Checkbox';
import { DateTimePicker } from '../core/DateTimePicker';
import { Input } from '../core/Input';
import { InputHelperText } from '../core/InputHelperText';
import {
  controlBorderRadius,
  gradientBackground,
  loadingPulse,
} from '../core/styles';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import { editPageContainerSx, editSurveyPaths } from './EditSurvey';
import { InitialSurveyLanguageSettings } from './InitialSurveyLanguageSettings';

const useStyles = makeStyles({
  actions: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
});

interface Props {
  canEdit: boolean;
}

export default function EditSurveyBasicSettings(props: Props) {
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deleteSurveyLoading, setDeleteSurveyLoading] = useState(false);

  const {
    activeSurvey,
    activeSurveyLoading,
    originalActiveSurvey,
    editSurvey,
    validationErrors,
    deleteActiveSurvey,
  } = useSurvey();

  const { url } = useRouteMatch();
  const surveyUrl = url.replace(`/${editSurveyPaths.basicSettings}`, '');
  const { tr, language } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();
  const workingLanguageInlineDescription =
    useWorkingLanguageInlineDescription();
  const { showToast } = useToasts();
  const history = useHistory();
  const classes = useStyles();
  const theme = useTheme();
  const testSurveyUrl = useMemo(() => {
    return getPublicSurveyUrl(
      originalActiveSurvey.organization.name,
      originalActiveSurvey.name,
      { test: true },
    );
  }, [originalActiveSurvey.name]);

  const editingDisabled = !props.canEdit || activeSurveyLoading;

  const languagesSet = hasEnabledLanguages(activeSurvey);
  const [languagesInitialized, setLanguagesInitialized] = useState(false);

  const localLanguage = useMemo(() => {
    switch (language) {
      case 'fi':
        return fiLocale;
      case 'en':
        return enLocale;
      case 'sv':
        return svLocale;
      default:
        return assertNever(language);
    }
  }, [language]);

  return (
    <>
      <Box
        sx={{
          width: '600px',
          ...editPageContainerSx,
          ...(activeSurveyLoading && loadingPulse),
        }}
      >
        <Stack>
          <Typography variant="mainHeader" component={'h1'}>
            {tr.EditSurvey.basicSettings}
          </Typography>
          <Stack
            sx={{
              marginTop:
                !languagesSet || languagesInitialized
                  ? editPageContainerSx.gap
                  : 0,
            }}
          >
            <Collapse in={!languagesSet} timeout={400} easing={'ease-in-out'}>
              <InitialSurveyLanguageSettings
                onSave={() => setLanguagesInitialized(true)}
              />
            </Collapse>
            <Collapse
              in={languagesInitialized}
              timeout={300}
              easing={'ease-in-out'}
            >
              <Box
                sx={{
                  display: 'flex',
                  color: 'textSecondary.main',
                  ...gradientBackground(theme),
                  border: `0.5px solid ${theme.palette.borderSubtle.main}`,
                  borderRadius: controlBorderRadius,
                  textDecoration: 'none',
                  padding: '20px 10px',
                  gap: '12px',
                  alignItems: 'center',
                }}
                component={NavLink}
                to={`${surveyUrl}/${editSurveyPaths.languageSettings}`}
              >
                <ArrowLeftIcon htmlColor={theme.palette.primary.main} />
                <span>
                  {'Voit muokata ja täydentää kieliasetuksia Kieliasetuksissa.'}
                </span>
              </Box>
            </Collapse>
          </Stack>
        </Stack>
        <Input
          required
          disabled={editingDisabled}
          error={validationErrors.includes('survey.title')}
          label={tr.EditSurveyInfo.title}
          inlineDescription={workingLanguageInlineDescription}
          value={activeSurvey.title?.[workingLanguage] ?? ''}
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              title: {
                ...activeSurvey.title,
                [workingLanguage]: event.target.value,
              },
            });
          }}
        />
        <Input
          label={tr.EditSurveyInfo.subtitle}
          disabled={editingDisabled}
          inlineDescription={workingLanguageInlineDescription}
          value={activeSurvey.subtitle?.[workingLanguage] ?? ''}
          onChange={(event) =>
            editSurvey({
              ...activeSurvey,
              subtitle: {
                ...activeSurvey.subtitle,
                [workingLanguage]: event.target.value,
              },
            })
          }
        />
        <RichTextEditor
          toolbarOptions={{
            options: ['inline', 'fontSize'],
            fontSize: {
              options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60],
            },
            inline: {
              options: ['bold', 'italic'],
            },
          }}
          editorStyle={{ background: theme.palette.surfaceInput.main }}
          disabled={editingDisabled}
          label={tr.EditSurveyInfo.description}
          value={activeSurvey.description?.[workingLanguage] ?? ''}
          onChange={(value) =>
            editSurvey({
              ...activeSurvey,
              description: {
                ...activeSurvey.description,
                [workingLanguage]: value,
              },
            })
          }
        />
        <Input
          sx={{
            '& .Input-inlineDescription': {
              color: 'textSubtle.main',
            },
          }}
          required
          disabled={editingDisabled}
          error={validationErrors.includes('survey.name')}
          label={tr.EditSurveyInfo.address}
          inlineDescription={{
            visible: getPublicSurveyUrl(
              originalActiveSurvey.organization.name,
              undefined,
              { excludeProtocol: true },
            ),
          }}
          value={activeSurvey.name ?? ''}
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              name: event.target.value,
            });
          }}
          helperText={tr.EditSurveyInfo.nameHelperText}
        />
        <TagPicker
          selectedTags={activeSurvey.tags}
          addEnabled={true}
          disabled={editingDisabled}
          onSelectedTagsChange={(t) =>
            editSurvey({
              ...activeSurvey,
              tags: t.map((t) => t),
            })
          }
        />
        <Input
          required
          disabled={editingDisabled}
          error={validationErrors.includes('survey.author')}
          label={tr.EditSurveyInfo.author}
          value={activeSurvey.author ?? ''}
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              author: event.target.value,
            });
          }}
        />
        <Input
          label={tr.EditSurveyInfo.authorUnit}
          disabled={editingDisabled}
          value={activeSurvey.authorUnit ?? ''}
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              authorUnit: event.target.value,
            });
          }}
        />
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={localLanguage}
          localeText={{
            dateTimePickerToolbarTitle: tr.EditSurveyInfo.selectDateAndTime,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'space-between',
              flex: 1,
            }}
          >
            <DateTimePicker
              label={tr.EditSurveyInfo.startDate}
              disabled={editingDisabled}
              value={activeSurvey.startDate}
              ampm={false}
              format="dd.MM.yyyy HH:mm"
              placeholder={tr.EditSurveyInfo.selectDate}
              onChange={(value: Date) => {
                editSurvey({
                  ...activeSurvey,
                  startDate: value,
                });
              }}
            />
            <DateTimePicker
              label={tr.EditSurveyInfo.endDate}
              disabled={editingDisabled}
              value={activeSurvey.endDate}
              format="dd.MM.yyyy HH:mm"
              placeholder={tr.EditSurveyInfo.selectDate}
              onChange={(value: Date) => {
                editSurvey({
                  ...activeSurvey,
                  endDate: value,
                });
              }}
            />
          </Box>
        </LocalizationProvider>
        <Checkbox
          label={tr.EditSurvey.allowSavingUnfinished}
          disabled={editingDisabled}
          checked={activeSurvey.allowSavingUnfinished}
          onChange={(event) =>
            editSurvey({
              ...activeSurvey,
              allowSavingUnfinished: event.target.checked,
            })
          }
          inputProps={{ 'aria-label': 'allow-unfinished' }}
        />
        <Checkbox
          label={tr.EditSurvey.displayPrivacyStatement}
          disabled={editingDisabled}
          checked={activeSurvey.displayPrivacyStatement}
          onChange={(event) =>
            editSurvey({
              ...activeSurvey,
              displayPrivacyStatement: event.target.checked,
            })
          }
          inputProps={{
            'aria-label': `${tr.EditSurvey.displayPrivacyStatement}`,
          }}
        />
        <div>
          <Checkbox
            label={tr.EditSurveyInfo.allowTestSurvey}
            helperText={
              <InputHelperText
                id={'publish-survey-helper-text'}
                sx={{ paddingTop: '4px' }}
              >
                {tr.EditSurveyInfo.allowTestSurveyHelperText}
              </InputHelperText>
            }
            disabled={editingDisabled}
            checked={activeSurvey.allowTestSurvey}
            aria-describedby={'publish-survey-helper-text'}
            onChange={(event) => {
              editSurvey({
                ...activeSurvey,
                allowTestSurvey: event.target.checked,
              });
            }}
          />
          {activeSurvey.allowTestSurvey && (
            <Box
              sx={{
                marginTop: '24px',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <Typography>
                {tr.EditSurveyInfo.testSurveyUrl}:{' '}
                <Link
                  href={testSurveyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {testSurveyUrl}
                </Link>
              </Typography>
              <CopyToClipboard data={testSurveyUrl} />
            </Box>
          )}
        </div>
        {props.canEdit && (
          <div className={classes.actions}>
            <LoadingButton
              variant="contained"
              color="error"
              loading={deleteSurveyLoading}
              onClick={() => {
                setDeleteConfirmDialogOpen(true);
              }}
            >
              {tr.EditSurvey.deleteSurvey}
            </LoadingButton>
          </div>
        )}
      </Box>
      <DeleteSurveyDialog
        open={deleteConfirmDialogOpen}
        survey={activeSurvey}
        onClose={async (result) => {
          setDeleteConfirmDialogOpen(false);
          if (result) {
            setDeleteSurveyLoading(true);
            try {
              await deleteActiveSurvey();
              setDeleteSurveyLoading(false);
              history.push('/');
              showToast({
                severity: 'success',
                message: tr.EditSurvey.deleteSurveySuccessful,
              });
            } catch (error) {
              setDeleteSurveyLoading(false);
              showToast({
                severity: 'error',
                message: tr.EditSurvey.deleteSurveyFailed,
              });
            }
          }
        }}
      />
    </>
  );
}
