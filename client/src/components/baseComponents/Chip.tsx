import { ChipProps, Chip as MuiChip } from '@mui/material';

/**
 * Compact pill chip styled to the admin design system.
 */
export function BaseChip({ sx, ...props }: ChipProps) {
  return (
    <MuiChip
      size="small"
      sx={{
        height: '28px',
        fontSize: '12px',
        borderRadius: '9999px',
        color: '#515b68',
        '& .MuiChip-label': { px: '8px' },
        ...(props.variant === 'outlined'
          ? { borderColor: '#E9ECEF', color: '#707b88' }
          : { backgroundColor: '#E9ECEF' }),
        ...sx,
      }}
      {...props}
    />
  );
}
