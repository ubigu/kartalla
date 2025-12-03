import { LocalizedText } from '@interfaces/survey';
import { Badge, Stack, ToggleButton, Typography } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { getNumberFormatter } from '@src/utils/format';

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
  const { tr, language } = useTranslations();
  const canAfford = price <= remainingBudget;
  const isDisabled = !isMapReady || !canAfford;
  const numberFormatter = getNumberFormatter(language);

  return (
    <Stack alignItems="center" spacing={0.5}>
      <Badge badgeContent={count} color="secondary">
        <ToggleButton
          size="small"
          value={targetName[currentLanguage]}
          selected={isActive}
          onChange={onSelect}
          disabled={isDisabled}
          aria-label={`${targetName[currentLanguage]}, ${price}${unit} ${count > 0 ? `× ${count} ${tr.GeoBudgetingQuestion.placed}` : ''}${!canAfford ? `, ${tr.GeoBudgetingQuestion.exceedsBudget}` : ''}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '0.5rem',
            minWidth: '120px',
            maxWidth: '300px',
            ...(isDisabled && {
              opacity: 0.5,
              '& img': {
                filter: 'grayscale(100%)',
              },
            }),
          }}
        >
          <img
            style={{ height: '1.5rem', width: '1.5rem' }}
            src={
              icon
                ? `data:image/svg+xml;utf8,${encodeURIComponent(icon)}`
                : '/api/feature-styles/icons/point_icon'
            }
            alt=""
            aria-hidden="true"
          />
          <Typography
            sx={{
              fontSize: '0.95rem',
              fontWeight: 500,
              textTransform: 'none',
              textAlign: 'start',
            }}
          >
            {targetName[currentLanguage]}
          </Typography>
        </ToggleButton>
      </Badge>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textAlign: 'center',
          fontSize: '0.8rem',
        }}
      >
        {numberFormatter.format(price)}&nbsp;{unit}
      </Typography>
    </Stack>
  );
}
