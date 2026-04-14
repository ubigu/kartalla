// @ts-strict-ignore
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TagPicker } from '@src/components/admin/TagPicker';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { assertNever } from '@src/utils/typeCheck';
import enLocale from 'date-fns/locale/en-GB';
import fiLocale from 'date-fns/locale/fi';
import svLocale from 'date-fns/locale/sv';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CopyToClipboard from '../CopyToClipboard';
import DeleteSurveyDialog from '../DeleteSurveyDialog';
import Fieldset from '../Fieldset';
import LoadingButton from '../LoadingButton';
import RichTextEditor from '../RichTextEditor';

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
  const { tr, surveyLanguage, language } = useTranslations();
  const { showToast } = useToasts();
  const history = useHistory();
  const classes = useStyles();

  const testSurveyUrl = useMemo(() => {
    return `${window.location.origin}/${originalActiveSurvey.organization.name}/${originalActiveSurvey.name}/testi`;
  }, [originalActiveSurvey.name]);

  const localLanguage = useMemo(() => {
    switch (language) {
      case 'fi':
        return fiLocale;
      case 'en':
        return enLocale;
      case 'se':
        return svLocale;
      default:
        return assertNever(language);
    }
  }, [language]);

  return (
    <>
      <Fieldset loading={activeSurveyLoading}>
        <Typography variant="h4" component={'h1'}>
          {tr.EditSurvey.basicSettings}
        </Typography>
        <TextField
          required
          error={validationErrors.includes('survey.title')}
          label={tr.EditSurveyInfo.title}
          value={activeSurvey.title?.[surveyLanguage] ?? ''}
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              title: {
                ...activeSurvey.title,
                [surveyLanguage]: event.target.value,
              },
            });
          }}
        />
        <TextField
          label={tr.EditSurveyInfo.subtitle}
          value={activeSurvey.subtitle?.[surveyLanguage] ?? ''}
          onChange={(event) =>
            editSurvey({
              ...activeSurvey,
              subtitle: {
                ...activeSurvey.subtitle,
                [surveyLanguage]: event.target.value,
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
          label={tr.EditSurveyInfo.description}
          value={activeSurvey.description?.[surveyLanguage] ?? ''}
          onChange={(value) =>
            editSurvey({
              ...activeSurvey,
              description: {
                ...activeSurvey.description,
                [surveyLanguage]: value,
              },
            })
          }
        />
        <TextField
          required
          error={validationErrors.includes('survey.name')}
          label={tr.EditSurveyInfo.name}
          value={activeSurvey.name ?? ''}
          inputProps={{ maxLength: 100 }}
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
          onSelectedTagsChange={(t) =>
            editSurvey({
              ...activeSurvey,
              tags: t.map((t) => t),
            })
          }
        />
        <TextField
          required
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
        <TextField
          label={tr.EditSurveyInfo.authorUnit}
          value={activeSurvey.authorUnit ?? ''}
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              authorUnit: event.target.value,
            });
          }}
        />
        <Box
          sx={{
            width: '220px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={localLanguage}
            localeText={{
              dateTimePickerToolbarTitle: tr.EditSurveyInfo.selectDateAndTime,
            }}
          >
            <DateTimePicker
              label={tr.EditSurveyInfo.startDate}
              value={activeSurvey.startDate}
              ampm={false}
              format="dd.MM.yyyy HH:mm"
              onChange={(value: Date) => {
                editSurvey({
                  ...activeSurvey,
                  startDate: value,
                });
              }}
            />
            <DateTimePicker
              label={tr.EditSurveyInfo.endDate}
              value={activeSurvey.endDate}
              format="dd.MM.yyyy HH:mm"
              onChange={(value: Date) => {
                editSurvey({
                  ...activeSurvey,
                  endDate: value,
                });
              }}
            />
          </LocalizationProvider>
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={activeSurvey.allowSavingUnfinished}
              onChange={(event) =>
                editSurvey({
                  ...activeSurvey,
                  allowSavingUnfinished: event.target.checked,
                })
              }
              inputProps={{ 'aria-label': 'allow-unfinished' }}
            />
          }
          label={tr.EditSurvey.allowSavingUnfinished}
        />
        <FormControlLabel
          control={
            <Checkbox
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
          }
          label={tr.EditSurvey.displayPrivacyStatement}
        />
        <div>
          <FormControlLabel
            label={tr.EditSurveyInfo.allowTestSurvey}
            control={
              <Checkbox
                checked={activeSurvey.allowTestSurvey}
                onChange={(event) => {
                  editSurvey({
                    ...activeSurvey,
                    allowTestSurvey: event.target.checked,
                  });
                }}
              />
            }
          />
          {activeSurvey.allowTestSurvey && (
            <div
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
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
            </div>
          )}
          <FormHelperText>
            {tr.EditSurveyInfo.allowTestSurveyHelperText}
          </FormHelperText>
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
      </Fieldset>
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
