import { Box, Divider, Typography } from '@mui/material';
import { BaseChip } from '@src/components/baseComponents/Chip';
import AddIcon from '@src/components/icons/AddIcon';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import Fieldset from '../Fieldset';

export default function EditSurveyTranslationsV2() {
  const { activeSurvey, activeSurveyLoading } = useSurvey();
  const { tr, languages } = useTranslations();

  const enabledLanguages = languages.filter(
    (lang) => activeSurvey.enabledLanguages[lang],
  );

  return (
    <Fieldset loading={activeSurveyLoading}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{ fontSize: '12px', color: '#008577', lineHeight: 'normal' }}
          >
            {tr.EditSurveyTranslations.supportedLanguages}
          </span>
          <Box
            sx={{
              display: 'flex',
              gap: '2px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {enabledLanguages.map((lang) => (
              <BaseChip
                key={lang}
                label={`${tr.EditSurveyTranslations[lang]} (${lang})`}
              />
            ))}
            <BaseChip
              variant="outlined"
              icon={
                <AddIcon
                  sx={{ fontSize: '10px !important', ml: '8px', mr: '-4px' }}
                />
              }
              label={tr.EditSurveyTranslations.addLanguage}
            />
          </Box>
        </Box>

        <Divider />

        <Typography variant="mainHeader" component={'h1'}>
          {tr.EditSurvey.translations}
        </Typography>
      </Box>
    </Fieldset>
  );
}
