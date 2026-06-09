import { ChipProps, Chip as MuiChip } from '@mui/material';
import { pillBorderRadius } from './styles';

export function Chip({ sx, ...props }: ChipProps) {
  return (
    <MuiChip
      size="small"
      sx={[
        (theme) => ({
          height: '28px',
          fontSize: '12px',
          borderRadius: pillBorderRadius,
          '& .MuiChip-label': { px: '8px' },
          ...(props.variant === 'outlined'
            ? {
                borderColor: theme.palette.borderSubtle.main,
                color: theme.palette.textSubtle.main,
              }
            : { backgroundColor: theme.palette.surfaceSubtle.dark }),
        }),
        ...(Array.isArray(sx) ? sx : [sx ?? {}]),
      ]}
      {...props}
    />
  );
}
