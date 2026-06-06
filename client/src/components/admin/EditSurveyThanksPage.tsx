import { Box, Typography, useTheme } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  useWorkingLanguage,
  useWorkingLanguageInlineDescription,
} from '@src/stores/WorkingLanguageContext';
import { Input } from '../core/Input';
import { loadingPulse } from '../core/styles';
import RichTextEditor from '../RichTextEditor';
import { editPageContainerSx } from './EditSurvey';
import SurveyImageList from './SurveyImageList';

interface Props {
  canEdit?: boolean;
}

export default function EditSurveyThanksPage({ canEdit = true }: Props) {
  const { activeSurvey, activeSurveyLoading, editSurvey } = useSurvey();
  const { tr } = useTranslations();
  const { workingLanguage } = useWorkingLanguage();
  const workingLanguageInlineDescription =
    useWorkingLanguageInlineDescription();
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...editPageContainerSx,
        ...(activeSurveyLoading && loadingPulse),
      }}
    >
      <Typography variant="mainHeader" component={'h1'}>
        {tr.EditSurvey.thanksPage}
      </Typography>
      <Input
        label={tr.EditSurveyThanksPage.title}
        disabled={!canEdit || activeSurveyLoading}
        inlineDescription={workingLanguageInlineDescription}
        value={activeSurvey.thanksPage?.title?.[workingLanguage] ?? ''}
        onChange={(event) => {
          editSurvey({
            ...activeSurvey,
            thanksPage: {
              ...activeSurvey.thanksPage,
              title: {
                ...activeSurvey.thanksPage.title,
                [workingLanguage]: event.target.value,
              },
            },
          });
        }}
      />
      <RichTextEditor
        wrapperStyle={{
          minWidth: '540px',
        }}
        label={tr.EditSurveyThanksPage.text}
        disabled={!canEdit || activeSurveyLoading}
        value={activeSurvey.thanksPage.text?.[workingLanguage] ?? ''}
        editorStyle={{ background: theme.palette.surfaceInput.main }}
        onChange={(value) => {
          editSurvey({
            ...activeSurvey,
            thanksPage: {
              ...activeSurvey.thanksPage,
              text: {
                ...activeSurvey.thanksPage.text,
                [workingLanguage]: value,
              },
            },
          });
        }}
      />
      <SurveyImageList canEdit={canEdit} imageType={'thanksPageImage'} />
    </Box>
  );
}
