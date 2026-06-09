import { useSurvey } from '@src/stores/SurveyContext';

import { Box } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import { Fragment } from 'react/jsx-runtime';
import { AdminAppBar } from './AdminAppBar';

export default function EditSurveyHeader() {
  // Change title only on save?
  const { originalActiveSurvey } = useSurvey();
  const { tr } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();

  const surveyTitle =
    originalActiveSurvey?.title?.[workingLanguage] ?? tr.EditSurvey.newSurvey;

  return (
    <AdminAppBar
      labels={[
        <Fragment key={surveyTitle}>
          {`${tr.AppBar.survey}: `}
          <Box component={'span'} sx={{ fontWeight: 'normal' }}>
            {surveyTitle}
          </Box>
        </Fragment>,
      ]}
    />
  );
}
