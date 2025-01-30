import { User } from '@interfaces/user';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Link,
  Skeleton,
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
import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUser } from '../../stores/UserContext';
import CopyToClipboard from '../CopyToClipboard';
import DeleteSurveyDialog from '../DeleteSurveyDialog';
import Fieldset from '../Fieldset';
import LoadingButton from '../LoadingButton';
import ColorSelect from './ColorSelect';
import SurveyImageList from './SurveyImageList';
import { SurveyMarginImageList } from './SurveyImageListWrapper';
import ThemeSelect from './ThemeSelect';

const useStyles = makeStyles({
  dateTimePicker: {
    width: 'fit-content',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
});

interface Props {
  canEdit: boolean;
}

export default function EditSurveyInfo(props: Props) {
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deleteSurveyLoading, setDeleteSurveyLoading] = useState(false);

  const {
    activeSurvey,
    activeSurveyLoading,
    originalActiveSurvey,
    editSurvey,
    validationErrors,
    deleteActiveSurvey,
    availableMapLayers,
    availableMapLayersLoading,
  } = useSurvey();
  const { tr, surveyLanguage, language } = useTranslations();
  const { showToast } = useToasts();
  const history = useHistory();
  const classes = useStyles();
  const { allUsers, activeUser } = useUser();

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
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              subtitle: {
                ...activeSurvey.subtitle,
                [surveyLanguage]: event.target.value,
              },
            });
          }}
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
        <TextField
          error={validationErrors.includes('survey.mapUrl')}
          label={tr.EditSurveyInfo.mapUrl}
          value={activeSurvey.mapUrl ?? ''}
          onChange={(event) => {
            editSurvey({
              ...activeSurvey,
              mapUrl: event.target.value,
            });
          }}
          helperText={
            validationErrors.includes('survey.mapUrl') &&
            tr.EditSurveyInfo.mapUrlError
          }
        />

        <Autocomplete
          multiple
          filterSelectedOptions
          disabled={allUsers == null || !props.canEdit}
          options={
            // Options: all users except the survey author and the current user
            allUsers?.filter(
              (user) =>
                user.id !== activeSurvey.authorId && user.id !== activeUser.id,
            ) ?? []
          }
          getOptionLabel={(user) => user.fullName}
          value={
            allUsers?.filter(
              (user) => activeSurvey.editors?.includes(user.id),
            ) ?? []
          }
          onChange={(_, value: User[]) => {
            editSurvey({
              ...activeSurvey,
              editors: value.map((user) => user.id),
            });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label={tr.EditSurveyInfo.editors}
              helperText={tr.EditSurveyInfo.editorsHelperText}
            />
          )}
          // If active user is among the selected editor tags, disable the chip
          renderTags={(value: User[], getTagProps) => {
            return value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option.fullName}
                  {...tagProps}
                  // Disable selection of current user
                  disabled={option.id === activeUser.id}
                />
              );
            });
          }}
        />
        <Autocomplete
          multiple
          filterSelectedOptions
          disabled={allUsers == null || !props.canEdit}
          options={
            // Options: all users except the survey author and the current user
            allUsers?.filter(
              (user) =>
                user.id !== activeSurvey.authorId && user.id !== activeUser.id,
            ) ?? []
          }
          getOptionLabel={(user) => user.fullName}
          value={
            allUsers?.filter(
              (user) => activeSurvey.viewers?.includes(user.id),
            ) ?? []
          }
          onChange={(_, value: User[]) => {
            editSurvey({
              ...activeSurvey,
              viewers: value.map((user) => user.id),
            });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label={tr.EditSurveyInfo.viewers}
              helperText={tr.EditSurveyInfo.viewersHelperText}
            />
          )}
          // If active user is among the selected editor tags, disable the chip
          renderTags={(value: User[], getTagProps) => {
            return value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option.fullName}
                  {...tagProps}
                  // Disable selection of current user
                  disabled={option.id === activeUser.id}
                />
              );
            });
          }}
        />
        {availableMapLayersLoading && (
          <Skeleton variant="rectangular" height={200} width="100%" />
        )}
        {!availableMapLayersLoading && availableMapLayers?.length > 0 && (
          <div>
            <FormLabel>{tr.EditSurveyInfo.availableMapLayers}</FormLabel>
            <ul>
              {availableMapLayers.map((layer) => (
                <li key={layer.id}>{layer.name}</li>
              ))}
            </ul>
          </div>
        )}
        <SurveyImageList
          imageType={'backgroundImage'}
          canEdit={props.canEdit}
        />
        <SurveyMarginImageList canEdit={props.canEdit} />

        <Box
          sx={{
            width: '206px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <ThemeSelect
            value={activeSurvey.theme?.id}
            onChange={(theme) => {
              editSurvey({
                ...activeSurvey,
                theme,
              });
            }}
          />
          <ColorSelect
            label={tr.EditSurveyInfo.titleColor}
            value={activeSurvey.sectionTitleColor}
            onChange={(color) => {
              editSurvey({
                ...activeSurvey,
                sectionTitleColor: color,
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
