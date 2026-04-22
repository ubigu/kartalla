import { Box, TextField, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { loadingPulse } from '../core/styles';
import RichTextEditor from '../RichTextEditor';
import SurveyImageList from './SurveyImageList';

interface Props {
  canEdit?: boolean;
}

export default function EditSurveyThanksPage({ canEdit = true }: Props) {
  const { activeSurvey, activeSurveyLoading, editSurvey } = useSurvey();
  const { tr, surveyLanguage } = useTranslations();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '36px',
        maxWidth: 'min(55em, 70%)',
        ...(activeSurveyLoading && loadingPulse),
      }}
    >
      <Typography variant="mainHeader" component={'h1'}>
        {tr.EditSurvey.thanksPage}
      </Typography>
      <TextField
        label={tr.EditSurveyThanksPage.title}
        value={activeSurvey.thanksPage?.title?.[surveyLanguage] ?? ''}
        onChange={(event) => {
          editSurvey({
            ...activeSurvey,
            thanksPage: {
              ...activeSurvey.thanksPage,
              title: {
                ...activeSurvey.thanksPage.title,
                [surveyLanguage]: event.target.value,
              },
            },
          });
        }}
      />
      <RichTextEditor
        label={tr.EditSurveyThanksPage.text}
        value={activeSurvey.thanksPage.text?.[surveyLanguage] ?? ''}
        onChange={(value) => {
          editSurvey({
            ...activeSurvey,
            thanksPage: {
              ...activeSurvey.thanksPage,
              text: {
                ...activeSurvey.thanksPage.text,
                [surveyLanguage]: value,
              },
            },
          });
        }}
      />
      <SurveyImageList canEdit={canEdit} imageType={'thanksPageImage'} />
    </Box>
  );
}
