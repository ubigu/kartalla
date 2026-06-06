import { LockOutlined } from '@mui/icons-material';
import { Box, Typography, useTheme } from '@mui/material';
import { Language } from '@src/stores/TranslationContext';
import { Checkbox } from '../core/Checkbox';

interface Props {
  allLanguages: Language[];
  enabledLanguages: Record<Language, boolean>;
  onToggle: (lang: Language, enabled: boolean) => void;
  label: string;
  getLabel: (lang: Language) => string;
  primaryLanguage?: Language;
}

export function LanguageSelector({
  allLanguages,
  enabledLanguages,
  onToggle,
  label,
  getLabel,
  primaryLanguage,
}: Props) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Typography
        sx={{ fontSize: '12px', color: theme.palette.textInteractive.main }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', gap: '4px' }}>
        {allLanguages.map((lang, idx) => {
          const isChecked = !!enabledLanguages[lang];
          const isLocked = lang === primaryLanguage;
          return (
            <Checkbox
              key={`${lang}-${idx}`}
              label={
                isLocked ? (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {getLabel(lang)}
                    <LockOutlined sx={{ fontSize: '14px' }} />
                  </Box>
                ) : (
                  getLabel(lang)
                )
              }
              onClick={isLocked ? undefined : () => onToggle(lang, !isChecked)}
              checked={isChecked}
              disabled={isLocked}
            />
          );
        })}
      </Box>
    </Box>
  );
}
