import { LanguageCode } from '@interfaces/survey';
import { Box, Theme } from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import { ReactNode } from 'react';

export const TRANSLATION_ROW_LABEL_WIDTH = '160px';
type VerticalAlign = 'top' | 'middle' | 'bottom';

const thSx = (theme: Theme, verticalAlign?: VerticalAlign) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  textAlign: 'left',
  padding: '4px 8px',
  width: TRANSLATION_ROW_LABEL_WIDTH,
  verticalAlign: verticalAlign ?? 'middle',
});

const tdSx = {
  padding: '4px 6px',
  verticalAlign: 'middle',
} as const;

const getTableRowStyles = (
  theme: Theme,
  stripe: boolean,
): SystemStyleObject<Theme> => {
  if (stripe) {
    return {
      '& th, & td': { background: theme.palette.surfaceSubtle.main },
      '& th:first-of-type, & td:last-of-type': { borderRadius: '6px' },
    };
  }
  return { '& input': { background: theme.palette.surfacePrimary.main } };
};

export function TranslationRow({
  label,
  stripe,
  cols,
  render,
  headerVerticalAlign,
}: {
  label: ReactNode;
  stripe: boolean;
  cols: LanguageCode[];
  render: (lang: LanguageCode) => ReactNode;
  headerVerticalAlign?: VerticalAlign;
}) {
  return (
    <Box component="tr" sx={(theme) => getTableRowStyles(theme, stripe)}>
      <Box
        component="th"
        sx={(theme) => thSx(theme, headerVerticalAlign)}
        scope="row"
      >
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
