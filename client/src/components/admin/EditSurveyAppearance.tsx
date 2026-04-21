// @ts-strict-ignore
import { Box, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { loadingPulse } from '../core/styles';
import ColorSelect from './ColorSelect';
import SurveyImageList from './SurveyImageList';
import { SurveyMarginImageList } from './SurveyImageListWrapper';
import ThemeSelect from './ThemeSelect';

interface Props {
  canEdit: boolean;
}

export default function EditSurveyAppearance(props: Props) {
  const { activeSurvey, activeSurveyLoading, editSurvey } = useSurvey();
  const { tr } = useTranslations();

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
        {tr.EditSurvey.appearance}
      </Typography>
      <SurveyImageList imageType={'backgroundImage'} canEdit={props.canEdit} />
      <SurveyMarginImageList canEdit={props.canEdit} />
      <Box
        sx={{
          width: '220px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <ThemeSelect
          value={activeSurvey.theme?.id}
          onChange={(theme) => {
            editSurvey({
              ...activeSurvey,
              theme,
            });
          }}
        />
        <ColorSelect
          label={tr.EditSurveyInfo.titleColor}
          value={activeSurvey.sectionTitleColor}
          onChange={(color) => {
            editSurvey({
              ...activeSurvey,
              sectionTitleColor: color,
            });
          }}
        />
      </Box>
    </Box>
  );
}
