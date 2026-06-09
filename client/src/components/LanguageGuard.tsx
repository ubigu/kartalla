import { Box, CircularProgress } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function LanguageGuard({ children }: Props) {
  const { language } = useTranslations();
  if (language === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  return <>{children}</>;
}
