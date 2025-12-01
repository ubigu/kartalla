import { Box, Toolbar } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { AdminAppBar } from './AdminAppBar';
import SurveyList from './SurveyList';

export default function AdminFrontPage() {
  const { tr } = useTranslations();

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminAppBar labels={[tr.SurveyList.title.frontPage]} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <Toolbar />
        <SurveyList />
      </Box>
    </Box>
  );
}
