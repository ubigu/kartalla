import { SurveyTheme } from '@interfaces/survey';
import { Box, Theme } from '@mui/material';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useState } from 'react';
import { Select } from '../core/Select';
import ColorIndicator from './ColorIndicator';

interface Props {
  value: number | null;
  onChange: (theme: SurveyTheme | null) => void;
}

export default function ThemeSelect({ value, onChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<SurveyTheme[]>([]);

  const { showToast } = useToasts();
  const { tr } = useTranslations();

  useEffect(() => {
    async function fetchThemes() {
      try {
        const themes = await fetch('/api/themes').then(
          (response) => response.json() as Promise<SurveyTheme[]>,
        );
        setThemes(themes);
      } catch (error) {
        showToast({
          severity: 'error',
          message: tr.EditSurveyInfo.themeFetchFailed,
        });
      }
      setLoading(false);
    }
    fetchThemes();
  }, []);

  const themeOptions = themes.map((theme) => ({
    value: theme.id,
    label: theme.name ?? '',
  }));

  const options = [
    { value: -1, label: tr.EditSurveyInfo.selectTheme },
    ...themeOptions,
  ];

  return (
    <Select<number>
      id="theme"
      label={tr.EditSurveyInfo.theme}
      disabled={loading}
      placeholder={tr.EditSurveyInfo.selectTheme}
      value={loading || value == null ? -1 : value}
      onChange={(selectedValue) => {
        const selectedId = selectedValue ? selectedValue : null;
        onChange(themes.find((theme) => theme.id === selectedId) ?? null);
      }}
      renderLabel={(opt) => {
        const theme = themes.find((t) => t.id === opt.value);
        return (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'space-between',
            }}
          >
            {opt.label}
            <Box display={'flex'}>
              <ColorIndicator
                color={(theme?.data as Theme)?.palette?.primary?.main}
              />
              <ColorIndicator
                color={(theme?.data as Theme)?.palette?.secondary?.main}
              />
            </Box>
          </Box>
        );
      }}
      renderDisplayLabel={(opt) => {
        const theme = themes.find((t) => t?.id === opt?.value);
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'space-between',
            }}
          >
            {opt?.label}
            <Box display={'flex'}>
              <ColorIndicator
                color={(theme?.data as Theme)?.palette?.primary?.main}
              />
              <ColorIndicator
                color={(theme?.data as Theme)?.palette?.secondary?.main}
              />
            </Box>
          </Box>
        );
      }}
      options={options}
    />
  );
}
