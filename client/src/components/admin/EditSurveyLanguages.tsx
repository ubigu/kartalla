import { EnabledLanguages, Survey, SurveyPage } from '@interfaces/survey';
import {
  Box,
  BoxProps,
  Button,
  Collapse,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import {
  Language,
  supportedLanguages,
  useTranslations,
} from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import {
  clearSurveyLanguage,
  copySurveyLanguage,
  countSurveyTranslations,
} from '@src/utils/surveyTranslations';
import { ReactNode, useMemo, useState } from 'react';
import { BaseDialog } from '../core/BaseDialog';
import { Checkbox } from '../core/Checkbox';
import { Select } from '../core/Select';
import ClearIcon from '../icons/ClearIcon';
import { editPageContainerSx } from './EditSurvey';

interface Props {
  canEdit: boolean;
}

function applySurveyLanguageChange(
  survey: Survey,
  editSurvey: (survey: Survey) => void,
  editPage: (page: SurveyPage) => void,
) {
  editSurvey(survey);
  survey.pages?.forEach(editPage);
}

type LanguageItemProps = {
  label: ReactNode;
  isLocked: boolean;
  filled: number;
  total: number;
  isWorkingLanguage: boolean;
  component?: BoxProps['component'];
  onDeleteTranslations?: () => void;
} & (
  | {
      variant: 'checkbox';
      isChecked: boolean;
      onToggle: () => void;
      disabled?: boolean;
    }
  | { variant: 'plain' }
);

function getTranslationCountColor(filled: number, total: number) {
  if (filled === total) return 'primary.main';
  if (filled > 0) return 'textWarning.main';
  return undefined;
}

function LanguageItem(props: LanguageItemProps) {
  const {
    label,
    isLocked,
    filled,
    total,
    isWorkingLanguage,
    component,
    onDeleteTranslations,
    variant,
  } = props;

  const countColor =
    !isLocked || isWorkingLanguage
      ? getTranslationCountColor(filled, total)
      : undefined;

  const { tr } = useTranslations();

  const countSection = (
    <Box component="span" sx={{ color: countColor }}>
      {variant === 'checkbox' && (
        <Box component={'span'} sx={{ color: 'textSubtle.main' }}>
          {tr.SurveyLanguageMenu.translationsEntered}&nbsp;
        </Box>
      )}
      {`${filled}/${total}`}
    </Box>
  );

  const showWorkingLanguageBadge = isWorkingLanguage && variant !== 'checkbox';

  const trailingSlot = showWorkingLanguageBadge ? (
    <>
      &nbsp;{'-'}&nbsp;
      <Box component="span" sx={{ color: 'primary.main' }}>
        {tr.SurveyLanguageMenu.surveyLanguage}
      </Box>
    </>
  ) : onDeleteTranslations ? (
    <Button
      onClick={onDeleteTranslations}
      variant="text"
      sx={{
        color: 'textSecondary.main',
        fontStyle: variant === 'checkbox' ? 'default' : 'italic',
      }}
    >
      {tr.SurveyLanguageMenu.deleteTranslations}
    </Button>
  ) : null;

  const labelContent = (
    <Box component={component ?? 'span'} display="flex" alignItems="center">
      <Box component="span">
        {label}
        {':'}
      </Box>
      &nbsp;
      {countSection}
      {trailingSlot}
    </Box>
  );

  if (props.variant === 'checkbox') {
    const isDisabled = isLocked || props.disabled;
    return (
      <Checkbox
        label={labelContent}
        onClick={isDisabled ? undefined : props.onToggle}
        checked={props.isChecked}
        disabled={isDisabled}
      />
    );
  }

  return labelContent;
}

function useLanguageItemData() {
  const { activeSurvey } = useSurvey();
  const { tr } = useTranslations();
  const { workingLanguage, setWorkingLanguage } = useWorkingLanguage();

  const translationCounts = useMemo(
    () => countSurveyTranslations(activeSurvey, supportedLanguages),
    [activeSurvey],
  );

  function getLabel(lang: (typeof supportedLanguages)[number]) {
    return (
      <Box component={'span'} sx={{ fontWeight: 700 }}>
        {tr.EditSurveyTranslations[lang]} <span>{`(${lang})`}</span>
      </Box>
    );
  }

  return {
    activeSurvey,
    workingLanguage,
    setWorkingLanguage,
    translationCounts,
    getLabel,
  };
}

function LanguageList() {
  const { activeSurvey, workingLanguage, translationCounts, getLabel } =
    useLanguageItemData();
  const { editSurvey, editPage } = useSurvey();
  const { tr } = useTranslations();

  function handleDeleteTranslations(lang: Language) {
    applySurveyLanguageChange(
      clearSurveyLanguage({ ...activeSurvey }, lang),
      editSurvey,
      editPage,
    );
  }

  return (
    <Stack sx={{ gap: '8px' }}>
      <Typography
        component="p"
        sx={(theme) => ({
          padding: 0,
          margin: 0,
          fontSize: '12px',
          color: theme.palette.textInteractive.main,
        })}
      >
        {tr.SurveyLanguageMenu.enteredTranslations}
      </Typography>
      <Stack
        component={'ul'}
        sx={{
          margin: 0,
          listStyle: 'none',
          paddingLeft: '8px',
          gap: '2px',
        }}
      >
        {supportedLanguages
          .filter((lang) => translationCounts[lang].filled > 0)
          .map((lang, idx) => (
            <LanguageItem
              component={'li'}
              key={`${lang}-${idx}`}
              variant="plain"
              label={getLabel(lang)}
              isWorkingLanguage={lang === workingLanguage}
              isLocked={false}
              filled={translationCounts[lang].filled}
              total={translationCounts[lang].total}
              onDeleteTranslations={() => handleDeleteTranslations(lang)}
            />
          ))}
      </Stack>
    </Stack>
  );
}

function MultiLanguageFieldset({ canEdit }: { canEdit: boolean }) {
  const { activeSurvey, editSurvey, editPage } = useSurvey();
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const { workingLanguage, translationCounts, getLabel, setWorkingLanguage } =
    useLanguageItemData();

  const enabledLanguageKeys = supportedLanguages.filter(
    (lang) => activeSurvey.enabledLanguages[lang],
  );

  function handleDeleteTranslations(lang: Language) {
    applySurveyLanguageChange(
      clearSurveyLanguage({ ...activeSurvey }, lang),
      editSurvey,
      editPage,
    );
  }

  function handleLanguageToggle(
    lang: (typeof supportedLanguages)[number],
    enabled: boolean,
  ) {
    const next = { ...activeSurvey.enabledLanguages, [lang]: enabled };
    if (!Object.values(next).some(Boolean)) {
      showToast({
        severity: 'error',
        message: tr.EditSurveyTranslations.errorAtleastOnelanguage,
      });
      return;
    }
    editSurvey({ ...activeSurvey, enabledLanguages: next as EnabledLanguages });
  }

  return (
    <Stack
      component="fieldset"
      sx={{ padding: 0, margin: 0, border: 'none', gap: '12px' }}
    >
      <Typography
        component="legend"
        sx={(theme) => ({
          padding: 0,
          marginBottom: '2px',
          fontSize: '12px',
          color: theme.palette.textInteractive.main,
        })}
      >
        {tr.SurveyLanguageMenu.supportedLanguagesLabel}
      </Typography>
      {supportedLanguages.map((lang, idx) => {
        const isChecked = !!activeSurvey.enabledLanguages[lang];
        const isLocked = isChecked && enabledLanguageKeys.length === 1;
        return (
          <LanguageItem
            key={`${lang}-${idx}`}
            variant="checkbox"
            disabled={!canEdit}
            label={getLabel(lang)}
            isChecked={isChecked}
            isWorkingLanguage={lang === workingLanguage}
            isLocked={isLocked}
            filled={translationCounts[lang].filled}
            total={translationCounts[lang].total}
            onDeleteTranslations={
              isChecked || translationCounts[lang].filled === 0
                ? undefined
                : () => handleDeleteTranslations(lang)
            }
            onToggle={() => {
              if (isChecked && enabledLanguageKeys.length === 2) {
                const remainingLanguage = enabledLanguageKeys.find(
                  (language) => language !== lang,
                );
                if (remainingLanguage) setWorkingLanguage(remainingLanguage);
              }
              handleLanguageToggle(lang, !isChecked);
            }}
          />
        );
      })}
    </Stack>
  );
}

function LanguageMoveDialog({
  targetLanguage,
  onMove,
  onCancel,
  onDontMove,
}: {
  targetLanguage: Language | null;
  onMove: () => void;
  onCancel: () => void;
  onDontMove: () => void;
}) {
  const theme = useTheme();
  const { workingLanguage } = useWorkingLanguage();
  const { tr } = useTranslations();

  const dialogContent = (
    <Stack sx={{ gap: '8px', flex: 1 }}>
      <Typography sx={{ fontWeight: 300 }}>
        {tr.SurveyLanguageMenu.moveContentDialogDescription}
      </Typography>
      <Button
        onClick={onMove}
        variant="outlined"
        fullWidth
        sx={{ textAlign: 'start' }}
      >
        {tr.SurveyLanguageMenu.moveOption.replace(
          '{x}',
          targetLanguage ? tr.EditSurveyTranslations[targetLanguage] : '',
        )}
      </Button>
      <Button
        onClick={onDontMove}
        variant="outlined"
        fullWidth
        sx={{ textAlign: 'start' }}
      >
        {tr.SurveyLanguageMenu.dontMoveOption.replace(
          '{x}',
          tr.EditSurveyTranslations[workingLanguage],
        )}
      </Button>
    </Stack>
  );

  const dialogActions = (
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <Button
        onClick={onCancel}
        startIcon={<ClearIcon htmlColor={theme.palette.primary.main} />}
      >
        {tr.commands.cancel}
      </Button>
    </Box>
  );

  return (
    <BaseDialog
      title={tr.SurveyLanguageMenu.moveContentDialogTitle}
      open={!!targetLanguage}
      content={dialogContent}
      actions={dialogActions}
      onClose={() => onCancel()}
      sx={{ maxWidth: '360px' }}
    />
  );
}

export function EditSurveyLanguages({ canEdit }: Props) {
  const { activeSurvey, editSurvey, editPage } = useSurvey();
  const { tr } = useTranslations();
  const { workingLanguage, setWorkingLanguage } = useWorkingLanguage();
  const [proposedWorkingLanguage, setProposedWorkingLanguage] =
    useState<Language | null>(null);

  const languageMode = activeSurvey.localisationEnabled
    ? 'multilingual'
    : workingLanguage;

  const translationCounts = useMemo(
    () => countSurveyTranslations(activeSurvey, supportedLanguages),
    [activeSurvey],
  );

  const multipleTranslationsSet = useMemo(
    () =>
      Object.values(translationCounts).filter((count) => count.filled > 0)
        .length > 1,
    [translationCounts],
  );

  function handleSurveyLanguageModeChange(
    prevValue: Language | 'multilingual',
    newValue: Language | 'multilingual',
  ) {
    if (newValue === 'multilingual') {
      editSurvey({
        ...activeSurvey,
        localisationEnabled: true,
        enabledLanguages: {
          ...activeSurvey.enabledLanguages,
          [workingLanguage]: true,
        },
      });
    } else {
      editSurvey({
        ...activeSurvey,
        localisationEnabled: false,
        enabledLanguages: Object.fromEntries(
          supportedLanguages.map((l) => [l, l === newValue]),
        ) as EnabledLanguages,
      });
      if (prevValue === 'multilingual') {
        setWorkingLanguage(newValue);
      } else if (translationCounts[newValue].filled === 0) {
        setProposedWorkingLanguage(newValue);
      } else {
        setWorkingLanguage(newValue);
      }
    }
  }

  return (
    <Stack sx={editPageContainerSx}>
      <Typography variant="mainHeader" component="h1">
        {tr.EditSurvey.languageSettings}
      </Typography>
      <Select
        disabled={!canEdit}
        wrapperSx={{ width: 'fit-content', minWidth: '200px' }}
        id="language-settings-survey-language"
        label={tr.SurveyLanguageMenu.surveyLanguage}
        value={languageMode}
        onChange={(newValue) =>
          handleSurveyLanguageModeChange(languageMode, newValue)
        }
        options={[
          ...supportedLanguages.map((lang) => ({
            value: lang,
            label: `${tr.EditSurveyTranslations[lang].toLowerCase()} (${lang})`,
          })),
          {
            value: 'multilingual',
            label: tr.SurveyLanguageMenu.multilingualOption,
          },
        ]}
      />
      <Collapse
        in={activeSurvey.localisationEnabled || multipleTranslationsSet}
        timeout={200}
        easing="ease-in-out"
      >
        {activeSurvey.localisationEnabled ? (
          <MultiLanguageFieldset canEdit={canEdit} />
        ) : (
          <LanguageList />
        )}
      </Collapse>
      <LanguageMoveDialog
        targetLanguage={proposedWorkingLanguage}
        onMove={() => {
          if (!proposedWorkingLanguage) return;
          applySurveyLanguageChange(
            copySurveyLanguage(
              { ...activeSurvey },
              workingLanguage,
              proposedWorkingLanguage,
            ),
            editSurvey,
            editPage,
          );
          setWorkingLanguage(proposedWorkingLanguage);
          setProposedWorkingLanguage(null);
        }}
        onCancel={() => setProposedWorkingLanguage(null)}
        onDontMove={() => {
          if (proposedWorkingLanguage)
            setWorkingLanguage(proposedWorkingLanguage);
          setProposedWorkingLanguage(null);
        }}
      />
    </Stack>
  );
}
