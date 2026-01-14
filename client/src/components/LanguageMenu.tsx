import { LanguageCode } from '@interfaces/survey';
import { MenuItem, Select, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslations } from '@src/stores/TranslationContext';
import { CSSProperties } from 'react';
import LanguageIcon from './icons/LanguageIcon';

interface Props {
  style?: CSSProperties;
}

const useStyles = makeStyles({
  root: {
    cursor: 'pointer',
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
});

export default function LanguageMenu({ style }: Props) {
  const { tr, setLanguage, languages, language } = useTranslations();
  const classes = useStyles();

  return (
    <div className={classes.root} style={style}>
      <Tooltip
        arrow
        placement="left-end"
        title={tr.LanguageMenu.changeLanguage}
      >
        <Select
          inputProps={{ 'aria-label': tr.LanguageMenu.languageControl }}
          value={language}
          onChange={(event) => {
            const targetLanguage = event.target.value as LanguageCode;
            setLanguage(targetLanguage);
          }}
          IconComponent={LanguageIcon}
          sx={{
            color: 'inherit',
            '&>.MuiSelect-select': {
              // Accommodate the larger globe icon
              paddingRight: '38px !important',
            },
            '&>fieldset': {
              // Visual label not used, hide border and legend
              borderWidth: 0,
              '&>legend': { display: 'none' },
            },
            '&>.MuiSvgIcon-root': {
              // The component is used in admin panel and survey, must adapt
              color: 'inherit',
              fill: 'currentColor',
              position: 'absolute',
              right: '0px',
              pointerEvents: 'none',
              marginRight: '2px',
            },
          }}
        >
          {languages.map((lang, index) => (
            <MenuItem
              key={`lang-item-${index}`}
              value={lang}
              selected={lang === language}
            >
              {tr.LanguageMenu[lang]} ({lang.toLocaleUpperCase()})
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    </div>
  );
}
