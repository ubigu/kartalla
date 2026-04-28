import { theme } from '@src/themes/admin';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import TranslationProvider from '@src/stores/TranslationContext';

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
