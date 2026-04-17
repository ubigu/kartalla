import { SurveyTextSection } from '@interfaces/survey';
import { Typography } from '@mui/material';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { MarkdownView } from './MarkdownView';
import SectionInfo from './SectionInfo';

interface Props {
  section: SurveyTextSection;
  isFollowUp?: boolean;
}

export default function TextSection({ section, isFollowUp = false }: Props) {
  const { survey } = useSurveyAnswers();
  const { surveyLanguage } = useTranslations();

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {section.title?.[surveyLanguage] && (
          <Typography
            variant={isFollowUp ? 'followUpSectionTitle' : 'questionTitle'}
            sx={{ color: survey?.sectionTitleColor, margin: 0 }}
          >
            {section.title?.[surveyLanguage]}
          </Typography>
        )}
        {section.info && section.info?.[surveyLanguage] && (
          <SectionInfo
            infoText={section.info?.[surveyLanguage]}
            subject={section.title?.[surveyLanguage]}
          />
        )}
      </div>
      <div style={{ color: section.bodyColor }}>
        <MarkdownView>{section.body?.[surveyLanguage]}</MarkdownView>
      </div>
    </>
  );
}
