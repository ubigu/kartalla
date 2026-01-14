import { Box, useTheme } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { RedocStandalone } from 'redoc';
import { AdminAppBar } from '../AdminAppBar';

export function ApiInstructions() {
  const { tr } = useTranslations();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
      <AdminAppBar labels={[tr.SurveyList.title.frontPage]} />
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          position: 'relative',
          '& .redoc-wrap': {
            overflow: 'visible',
          },
          '& .menu-content': {
            height: 'calc(100vh - 64px) !important',
            top: '0',
            left: '0',
          },
        }}
      >
        <RedocStandalone
          specUrl="/api/openapi"
          options={{
            nativeScrollbars: true,
            theme: {
              colors: { primary: { main: theme.palette.primary.main } },
            },
          }}
        />
      </Box>
    </Box>
  );
}
