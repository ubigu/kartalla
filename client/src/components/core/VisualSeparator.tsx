import { Box } from '@mui/material';

interface Props {
  height?: number | string;
}

export function VisualSeparator({ height = '8px' }: Props) {
  return (
    <Box
      sx={{
        height,
        borderTop: '0.5px solid #59788626',
        backdropFilter: 'blur(4px)',
        background:
          'radial-gradient(ellipse 50% 100% at center top, #59788626, transparent)',
      }}
    />
  );
}
