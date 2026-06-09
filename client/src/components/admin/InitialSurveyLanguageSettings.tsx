import { EnabledLanguages } from '@interfaces/survey';
import {
  Box,
  Button,
  Collapse,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import {
  supportedLanguages,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import { useState } from 'react';
import Fieldset from '../Fieldset';
import { RadioButton } from '../core/RadioButton';
import { Select } from '../core/Select';
import { controlBorderRadius, gradientBackground } from '../core/styles';
import CheckIcon from '../icons/CheckIcon';
import { LanguageSelector } from './LanguageSelector';

interface Props {
  onSave: () => void;
}

export function InitialSurveyLanguageSettings({ onSave }: Props) {
  const { activeSurvey, editSurvey } = useSurvey();
  const { tr } = useTranslations();
  const { workingLanguage, setWorkingLanguage } = useWorkingLanguage();
  const { showToast } = useToasts();
  const theme = useTheme();

  const [localLocalisationEnabled, setLocalLocalisationEnabled] = useState(
    activeSurvey.localisationEnabled ?? false,
  );
  const [localEnabledLanguages, setLocalEnabledLanguages] = useState(
    activeSurvey.enabledLanguages,
  );

  return (
    <Stack
      sx={{
        gap: '10px',
        border: `0.5px solid ${theme.palette.borderSubtle.main}`,
        borderRadius: controlBorderRadius,
        padding: '16px',
        ...gradientBackground(theme),
      }}
    >
      <Typography
        variant="secondaryHeader"
        fontSize={'20px'}
        fontWeight={500}
        component={'h2'}
      >
        {tr.SurveyLanguageMenu.initialSettingsTitle}
      </Typography>
      <Typography>
        {tr.SurveyLanguageMenu.initialSettingsDescription}
      </Typography>

      <Select
        sx={(theme) => ({
          background: theme.palette.surfacePrimary.main,
        })}
        wrapperSx={{ width: 'fit-content' }}
        labelProps={{ style: { marginRight: '8px' } }}
        aria-describedby="common-helper-basic-setting-language-select"
        id="basic-settings-survey-language"
        label={tr.SurveyLanguageMenu.workingLanguageSelectLabel}
        value={workingLanguage}
        onChange={(lang) => {
          setWorkingLanguage(lang);
          if (!activeSurvey.localisationEnabled) {
            setLocalEnabledLanguages(
              Object.fromEntries(
                supportedLanguages.map((l) => [l, l === lang]),
              ) as typeof localEnabledLanguages,
            );
          }
        }}
        options={supportedLanguages.map((lang) => ({
          value: lang,
          label: `${tr.EditSurveyTranslations[lang].toLocaleLowerCase()} (${lang})`,
        }))}
      />
      <Fieldset sx={{ gap: '12px', padding: 0, marginY: '20px' }}>
        <Box component={'legend'} sx={{ marginBottom: '8px' }}>
          {tr.SurveyLanguageMenu.multilingualQuestion}
        </Box>
        <RadioButton
          checked={!localLocalisationEnabled}
          onChange={(e) => {
            setLocalLocalisationEnabled(!e.target.checked);
          }}
          label={`${tr.SurveyLanguageMenu.monolingualPrefix} ${tr.SurveyLanguageMenu.languageNames[workingLanguage]}`}
        />
        <RadioButton
          onChange={(e) => {
            setLocalLocalisationEnabled(e.target.checked);
            setLocalEnabledLanguages({
              ...localEnabledLanguages,
              [workingLanguage]: true,
            });
          }}
          checked={localLocalisationEnabled}
          label={tr.SurveyLanguageMenu.multilingualRadioLabel}
        />
      </Fieldset>
      <Collapse
        in={localLocalisationEnabled}
        timeout={200}
        easing={'ease-in-out'}
      >
        <LanguageSelector
          allLanguages={supportedLanguages}
          enabledLanguages={localEnabledLanguages}
          primaryLanguage={workingLanguage}
          label={tr.EditSurveyTranslations.supportedLanguages}
          getLabel={(lang) => `${tr.EditSurveyTranslations[lang]} (${lang})`}
          onToggle={(lang, enabled) => {
            const next = {
              ...localEnabledLanguages,
              [lang]: enabled,
            };
            if (!Object.values(next).some(Boolean)) {
              showToast({
                severity: 'error',
                message: tr.EditSurveyTranslations.errorAtleastOnelanguage,
              });
              return;
            }
            setLocalEnabledLanguages(next);
          }}
        />
      </Collapse>
      <Stack sx={{ gap: '8px', alignItems: 'center', marginTop: '24px' }}>
        <Typography
          sx={{
            fontSize: '12px',
            color: 'textSecondary.main',
            textAlign: 'center',
            flex: 1,
          }}
        >
          {tr.SurveyLanguageMenu.initialSettingsFootnote}
        </Typography>
        <Button
          onClick={() => {
            editSurvey({
              ...activeSurvey,
              enabledLanguages: Object.fromEntries(
                Object.entries(localEnabledLanguages).map(
                  ([lang, isActive]) => [
                    lang,
                    isActive || lang === workingLanguage,
                  ],
                ),
              ) as EnabledLanguages,
              localisationEnabled: localLocalisationEnabled,
            });
            onSave();
          }}
          endIcon={<CheckIcon />}
          variant="contained"
        >
          {tr.SurveyLanguageMenu.confirmLanguageSettings}
        </Button>
      </Stack>
    </Stack>
  );
}
