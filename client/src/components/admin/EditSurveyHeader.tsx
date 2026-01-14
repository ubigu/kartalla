import { useSurvey } from '@src/stores/SurveyContext';

import { useTranslations } from '@src/stores/TranslationContext';
import { AdminAppBar } from './AdminAppBar';

interface Props {
  sideBarWidth: number;
  onDrawerToggle: () => void;
}

export default function EditSurveyHeader(props: Props) {
  // Change title only on save?
  const { originalActiveSurvey } = useSurvey();
  const { surveyLanguage } = useTranslations();
  const { tr } = useTranslations();

  return (
    <AdminAppBar
      style={{
        width: { md: `calc(100% - ${props.sideBarWidth}px)` },
        ml: { md: `${props.sideBarWidth}px` },
      }}
      labels={[
        originalActiveSurvey?.title?.[surveyLanguage] ??
          tr.EditSurvey.newSurvey,
      ]}
      withHomeLink={false}
    />
  );
}
