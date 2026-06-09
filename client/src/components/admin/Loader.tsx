import { Box, CircularProgress, Typography } from '@mui/material';

interface Props {
  label?: string;
}

export default function Loader({ label }: Props) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label && (
        <Typography
          variant="h6"
          sx={{
            color: 'primary.main',
            '&::after': {
              display: 'inline-block',
              width: '1em',
              textAlign: 'left',
              animation: 'blink 1s steps(1, end) infinite',
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
          {label}
        </Typography>
      )}
      <CircularProgress sx={{ color: 'primary.main' }} />
    </Box>
  );
}
