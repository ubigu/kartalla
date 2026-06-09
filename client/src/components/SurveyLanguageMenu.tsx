import { LanguageCode } from '@interfaces/survey';
import { MenuItem, Select, Tooltip } from '@mui/material';
import { CSSProperties, makeStyles } from '@mui/styles';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
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

export default function SurveyLanguageMenu({ style }: Props) {
  const { tr, language, setLanguage } = useTranslations();
  const { survey } = useSurveyAnswers();
  const classes = useStyles();

  const languages = survey
    ? (Object.entries(survey.enabledLanguages)
        .filter(([, enabled]) => enabled)
        .map(([lang]) => lang) as LanguageCode[])
    : [];

  if (languages.length <= 1) return null;

  return (
    <div className={classes.root} style={style}>
      <Tooltip
        arrow
        placement="left-end"
        title={tr.SurveyLanguageMenu.changeSurveyLanguage}
      >
        <Select
          inputProps={{ 'aria-label': tr.SurveyLanguageMenu.languageControl }}
          size="small"
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          IconComponent={LanguageIcon}
          sx={{
            color: 'inherit',
            '&>.MuiSelect-select': {
              paddingRight: '38px !important',
            },
            '&>fieldset': {
              display: 'none',
            },
            '&>.MuiSvgIcon-root': {
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
