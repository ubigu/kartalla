import { Button, ButtonProps } from '@mui/material';

/**
 * Compact button styled to the admin design system.
 */
export function BaseButton({ sx, ...props }: ButtonProps) {
  return (
    <Button
      sx={{
        height: '28px',
        fontSize: '14px',
        fontWeight: 600,
        borderRadius: '3px',
        padding: '0 12px',
        minWidth: 'unset',
        textTransform: 'none',
        lineHeight: 1,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
        '&:active': { boxShadow: 'none' },
        ...sx,
      }}
      {...props}
    />
  );
}
