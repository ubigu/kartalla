import { LanguageCode } from '@interfaces/survey';
import { Box, Theme } from '@mui/material';
import { ReactNode } from 'react';

export const TRANSLATION_ROW_LABEL_WIDTH = '160px';

const thSx = (theme: Theme) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  textAlign: 'left',
  padding: '4px 8px',
  width: TRANSLATION_ROW_LABEL_WIDTH,
  verticalAlign: 'middle',
});

const tdSx = {
  padding: '4px 6px',
  verticalAlign: 'middle',
} as const;

export function TranslationRow({
  label,
  stripe,
  cols,
  render,
}: {
  label: ReactNode;
  stripe: boolean;
  cols: LanguageCode[];
  render: (lang: LanguageCode) => ReactNode;
}) {
  return (
    <Box
      component="tr"
      sx={(theme) =>
        stripe
          ? {
              background: theme.palette.surfaceSubtle.main,
              '& input': { background: theme.palette.surfaceSubtle.main },
            }
          : {}
      }
    >
      <Box component="th" sx={thSx} scope="row">
        {label}
      </Box>
      {cols.map((lang, idx) => (
        <Box component="td" key={`${lang}-${idx}`} sx={tdSx}>
          {render(lang)}
        </Box>
      ))}
    </Box>
  );
}
