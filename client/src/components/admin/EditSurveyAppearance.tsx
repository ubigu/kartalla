// @ts-strict-ignore
import { Box, Typography } from '@mui/material';
import { useSurvey } from '@src/stores/SurveyContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { loadingPulse } from '../core/styles';
import ColorSelect from './ColorSelect';
import { editPageContainerSx } from './EditSurvey';
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
        ...editPageContainerSx,
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
          disabled={!props.canEdit || activeSurveyLoading}
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
          disabled={!props.canEdit || activeSurveyLoading}
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
