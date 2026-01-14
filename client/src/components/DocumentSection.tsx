import { SurveyDocumentSection } from '@interfaces/survey';
import { FormLabel, Link, Typography } from '@mui/material';
import { useSurveyAnswers } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { getFileName } from '@src/utils/path';
import { useMemo } from 'react';
import SectionInfo from './SectionInfo';

interface Props {
  section: SurveyDocumentSection;
  isFollowUp?: boolean;
}

export default function DocumentSection({
  section,
  isFollowUp = false,
}: Props) {
  const { survey } = useSurveyAnswers();
  const { tr, surveyLanguage } = useTranslations();

  const fileName = useMemo(
    () => getFileName(section.fileUrl),
    [section.fileUrl],
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FormLabel>
          <Typography
            variant={isFollowUp ? 'followUpSectionTitle' : 'questionTitle'}
            sx={{ color: survey.sectionTitleColor ?? '#000000' }}
          >
            {section.title?.[surveyLanguage]}
          </Typography>
        </FormLabel>
        {section.info && section.info?.[surveyLanguage] && (
          <SectionInfo
            infoText={section.info?.[surveyLanguage]}
            subject={section.title?.[surveyLanguage]}
          />
        )}
      </div>
      <Link
        href={`/api/file/${section.fileUrl}`}
        target="_blank"
        rel="noreferrer"
      >
        {tr.DocumentSection.attachment}: {fileName}
      </Link>
    </>
  );
}
