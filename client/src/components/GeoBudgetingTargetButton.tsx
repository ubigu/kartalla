import { LocalizedText } from '@interfaces/survey';
import { Badge, Stack, ToggleButton, Typography } from '@mui/material';
import React from 'react';

interface Props {
  icon: string;
  targetName: LocalizedText;
  price: number;
  count: number;
  isActive: boolean;
  unit?: string;
  onSelect: () => void;
  isMapReady: boolean;
  currentLanguage: keyof LocalizedText;
  remainingBudget: number;
}

export default function GeoBudgetingTargetButton({
  icon,
  targetName,
  price,
  count,
  isActive,
  unit = '',
  onSelect,
  isMapReady,
  currentLanguage,
  remainingBudget,
}: Props) {
  const canAfford = price <= remainingBudget;
  const isDisabled = !isMapReady || !canAfford;

  return (
    <Stack alignItems="center" spacing={0.5}>
      <ToggleButton
        value={targetName[currentLanguage]}
        selected={isActive}
        onChange={onSelect}
        disabled={isDisabled}
        aria-label={`${targetName[currentLanguage]}, ${price}${unit} ${count > 0 ? `× ${count} placed` : 'not placed'}${!canAfford ? ', exceeds budget' : ''}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '0.5rem 1rem',
          minWidth: '120px',
          ...(isDisabled && {
            opacity: 0.5,
            '& img': {
              filter: 'grayscale(100%)',
            },
          }),
        }}
      >
        <Badge badgeContent={count} color="secondary">
          {icon ? (
            <img
              style={{ height: '2rem', width: '2rem' }}
              src={`data:image/svg+xml;base64,${btoa(icon)}`}
              alt=""
              aria-hidden="true"
            />
          ) : (
            <div
              style={{
                height: '2rem',
                width: '2rem',
                backgroundColor: '#ccc',
                borderRadius: '4px',
              }}
              aria-hidden="true"
            />
          )}
        </Badge>
        <Typography
          sx={{
            fontSize: '0.95rem',
            fontWeight: 500,
            textTransform: 'none',
          }}
        >
          {targetName[currentLanguage]}
        </Typography>
      </ToggleButton>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textAlign: 'center',
          fontSize: '0.8rem',
        }}
      >
        {price}
        {unit} × {count}
      </Typography>
    </Stack>
  );
}
