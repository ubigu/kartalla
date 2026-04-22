import { Box, useTheme } from '@mui/material';
import React from 'react';

interface CoreInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function CoreInput({ label, id, style, ...props }: CoreInputProps) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '2px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '12px',
            color: theme.palette.textInteractive.main,
            lineHeight: 'normal',
          }}
        >
          {label}
        </label>
      )}
      <Box
        component={'input'}
        id={id}
        sx={{
          height: '28px',
          fontSize: '14px',
          fontFamily: theme.typography.fontFamily,
          color: theme.palette.harmaa.main,
          backgroundColor: theme.palette.surfacePrimary.main,
          border: `0.5px solid ${theme.palette.borderSubtle.main}`,
          borderRadius: '3px',
          padding: '0 6px',
          boxShadow: '0px 1px 2px 0px #59788626 inset',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      />
    </Box>
  );
}
