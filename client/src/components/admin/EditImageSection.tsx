// @ts-strict-ignore
import { SurveyImageSection } from '@interfaces/survey';
import { TextField } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';

import FileUpload from './FileUpload';

interface Props {
  section: SurveyImageSection;
  onChange: (section: SurveyImageSection) => void;
  disabled?: boolean;
}

export default function EditImageSection({
  section,
  onChange,
  disabled,
}: Props) {
  const { activeSurvey } = useSurvey();
  const { tr } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();

  return (
    <>
      <FileUpload
        allowedFilesRegex={
          /^data:(?:image|video)\/(svg|png|jpg|jpeg|mp4|mkv|webm|avi|wmv|m4p|m4v|mpg|mpeg|mov);base64/
        }
        forMedia
        disabled={disabled}
        surveyId={activeSurvey.id}
        targetPath={[String(activeSurvey.id)]}
        surveyOrganizationId={activeSurvey.organization.id}
        value={
          !section.fileUrl
            ? null
            : [
                {
                  url: section.fileUrl,
                },
              ]
        }
        onUpload={({ url }) => {
          onChange({
            ...section,
            fileUrl: url,
          });
        }}
        onDelete={() => {
          onChange({
            ...section,
            fileUrl: null,
          });
        }}
      />
      <TextField
        value={section.altText[workingLanguage]}
        label={tr.EditImageSection.altText}
        onChange={(event) =>
          onChange({
            ...section,
            altText: {
              ...section.altText,
              [workingLanguage]: event.target.value,
            },
          })
        }
      />
      <TextField
        value={section.attributions}
        label={tr.EditImageSection.attributions}
        onChange={(event) =>
          onChange({
            ...section,
            attributions: event.target.value,
          })
        }
      />
    </>
  );
}
