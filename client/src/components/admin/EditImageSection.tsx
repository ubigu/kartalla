import { SurveyImageSection } from '@interfaces/survey';
import { TextField } from '@material-ui/core';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React from 'react';
import FileUpload from './FileUpload';

interface Props {
  section: SurveyImageSection;
  onChange: (section: SurveyImageSection) => void;
}

export default function EditImageSection({ section, onChange }: Props) {
  const { activeSurvey } = useSurvey();
  const { tr } = useTranslations();

  return (
    <>
      <FileUpload
        surveyId={activeSurvey.id}
        targetPath={[String(activeSurvey.id)]}
        value={
          !section.fileName
            ? null
            : [
                {
                  name: section.fileName,
                  path: section.filePath,
                },
              ]
        }
        onUpload={({ name, path }) => {
          onChange({
            ...section,
            fileName: name,
            filePath: path,
          });
        }}
        onDelete={() => {
          onChange({
            ...section,
            fileName: null,
            filePath: null,
          });
        }}
      />
      <TextField
        value={section.altText}
        label={tr.EditImageSection.altText}
        onChange={(event) =>
          onChange({ ...section, altText: event.target.value })
        }
      ></TextField>
    </>
  );
}
