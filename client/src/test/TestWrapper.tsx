import '@fontsource-variable/comfortaa';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/open-sans';
import { ThemeProvider } from '@mui/material/styles';
import TranslationProvider from '@src/stores/TranslationContext';
import { theme } from '@src/themes/admin';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function TestWrapper({ children }: Props) {
  return (
    <TranslationProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </TranslationProvider>
  );
}
