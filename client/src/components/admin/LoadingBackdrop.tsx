import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';
import React from 'react';

interface Props {
  open: boolean;
}

export function LoadingBackdrop({ open }: Props) {
  return (
    <Backdrop
      sx={(theme) => ({
        margin: '0 !important',
        zIndex: theme.zIndex.drawer + 1,
      })}
      open={open}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: '#fff',
          padding: '1rem',
          borderRadius: '8px',
        }}
      >
        <CircularProgress size={'1rem'} color="primary" />
        <Typography
          sx={{
            '&::after': {
              display: 'inline-block',
              width: '1em',
              textAlign: 'left',
              animation: 'blink 1s infinite',
              content: '""',
            },
            '@keyframes blink': {
              '0%, 20%': { content: '""' },
              '40%': { content: '"."' },
              '60%': { content: '".."' },
              '80%, 100%': { content: '"..."' },
            },
          }}
        >
          Kopioidaan kyselyä
        </Typography>
      </Box>
    </Backdrop>
  );
}
