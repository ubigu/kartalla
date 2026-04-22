import { useSurvey } from '@src/stores/SurveyContext';

import { useTranslations } from '@src/stores/TranslationContext';
import { AdminAppBar } from './AdminAppBar';

export default function EditSurveyHeader() {
  // Change title only on save?
  const { originalActiveSurvey } = useSurvey();
  const { surveyLanguage } = useTranslations();
  const { tr } = useTranslations();

  const surveyTitle =
    originalActiveSurvey?.title?.[surveyLanguage] ?? tr.EditSurvey.newSurvey;

  return <AdminAppBar labels={[`${tr.AppBar.survey}: ${surveyTitle}`]} />;
}
