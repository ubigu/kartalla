import { Box } from '@mui/material';
import React from 'react';

interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Compact labeled text input styled to the admin design system.
 */
export function BaseInput({ label, id, style, ...props }: BaseInputProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: '12px', color: '#008577', lineHeight: 'normal' }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          height: '28px',
          fontSize: '14px',
          fontFamily: 'Nunito, sans-serif',
          color: '#515b68',
          backgroundColor: 'white',
          border: '0.5px solid #E9ECEF',
          borderRadius: '3px',
          padding: '0 6px',
          boxShadow: 'inset 0px 1px 2px 0px rgba(89, 120, 134, 0.15)',
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
