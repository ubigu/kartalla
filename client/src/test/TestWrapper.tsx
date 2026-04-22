import { theme } from '@src/themes/admin';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function TestWrapper({ children }: Props) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
