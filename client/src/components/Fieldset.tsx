import { Box, SxProps, Theme } from '@mui/material';
import { loadingPulse } from '@src/components/core/styles';
import { ReactNode } from 'react';

interface Props {
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode | ReactNode[];
  sx?: SxProps<Theme>;
}

export default function Fieldset({ disabled, loading, children, sx }: Props) {
  return (
    <Box
      component="fieldset"
      disabled={disabled || loading}
      sx={[
        {
          margin: 0,
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        },
        loading && loadingPulse,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
