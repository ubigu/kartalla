import { SurveyDocumentSection } from '@interfaces/survey';
import { useSurvey } from '@src/stores/SurveyContext';

import FileUpload from './FileUpload';

interface Props {
  section: SurveyDocumentSection;
  onChange: (section: SurveyDocumentSection) => void;
  disabled?: boolean;
}

export default function EditDocumentSection({
  section,
  onChange,
  disabled,
}: Props) {
  const { activeSurvey } = useSurvey();

  return (
    <>
      <FileUpload
        allowedFilesRegex={
          /^data:(?:image\/(svg|png|jpg|jpeg)|application\/(pdf|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|xlsx|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|docx)|video\/(mp4|mkv|webm|avi|wmv|m4p|m4v|mpg|mpeg|mov));base64/
        }
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
    </>
  );
}
