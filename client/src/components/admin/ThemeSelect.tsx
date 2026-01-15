import { SurveyTheme } from '@interfaces/survey';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Theme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useState } from 'react';
import ColorIndicator from './ColorIndicator';

interface Props {
  value: number;
  onChange: (theme: SurveyTheme) => void;
}

const useStyles = makeStyles({
  select: {
    minWidth: '10rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default function ThemeSelect({ value, onChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<SurveyTheme[]>([]);

  const classes = useStyles();
  const { showToast } = useToasts();
  const { tr } = useTranslations();

  useEffect(() => {
    async function fetchThemes() {
      try {
        const themes = await fetch('/api/themes').then(
          (response) => response.json() as Promise<SurveyTheme[]>,
        );
        setThemes(themes);
      } catch {
        showToast({
          severity: 'error',
          message: tr.EditSurveyInfo.themeFetchFailed,
        });
      }
      setLoading(false);
    }
    fetchThemes();
  }, []);

  return (
    <FormControl>
      <InputLabel id="theme-select-label">{tr.EditSurveyInfo.theme}</InputLabel>
      <Select
        labelId="theme-select-label"
        id="theme"
        label={tr.EditSurveyInfo.theme}
        className={classes.select}
        classes={{
          select: classes.select,
        }}
        disabled={loading}
        value={loading || value == null ? '' : value}
        onChange={(event) => {
          onChange(
            themes.find((theme) => theme.id === event.target.value) ?? null,
          );
        }}
      >
        <MenuItem value="">
          <em>{tr.EditSurveyInfo.selectTheme}</em>
        </MenuItem>
        {themes.map((theme) => (
          <MenuItem key={theme.id} value={theme.id}>
            {theme.name}
            <div style={{ flexGrow: 1 }} />
            <ColorIndicator
              color={(theme.data as Theme)?.palette?.primary?.main}
            />
            <ColorIndicator
              color={(theme.data as Theme)?.palette?.secondary?.main}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
