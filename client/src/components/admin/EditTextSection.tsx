import { SurveyTextSection } from '@interfaces/survey';
import { useWorkingLanguage } from '@src/stores/WorkingLanguageContext';
import { useTranslations } from '@src/stores/TranslationContext';
import RichTextEditor from '../RichTextEditor';
import ColorSelect from './ColorSelect';

interface Props {
  section: SurveyTextSection;
  disabled?: boolean;
  onChange: (section: SurveyTextSection) => void;
}

export default function EditTextSection({
  section,
  disabled,
  onChange,
}: Props) {
  const { tr } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();

  return (
    <>
      <ColorSelect
        label={tr.EditTextSection.bodyColor}
        value={section.bodyColor}
        onChange={(color) => {
          onChange({ ...section, bodyColor: color });
        }}
      />
      <RichTextEditor
        disabled={disabled}
        value={section.body[workingLanguage]}
        label={tr.EditTextSection.text}
        onChange={(value) =>
          onChange({
            ...section,
            body: { ...section.body, [workingLanguage]: value },
          })
        }
      />
    </>
  );
}
