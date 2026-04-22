import { Box } from '@mui/material';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

interface SurveyPageIconProps extends SvgIconProps {
  innerText?: string | number;
  innerTextColor?: string;
}

export default function SurveyPageIcon({
  innerText,
  innerTextColor,
  ...props
}: SurveyPageIconProps) {
  const icon = (
    <SvgIcon {...props}>
      <svg
        width="20"
        height="22"
        viewBox="0 0 20 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13.0757 1.00211C12.7542 0.680615 12.3181 0.500003 11.8635 0.500003L2.21435 0.5C1.75969 0.5 1.32366 0.680612 1.00216 1.0021C0.680683 1.32359 0.500066 1.75962 0.500066 2.21429L0.499978 19.7899C0.499978 20.2446 0.680595 20.6807 1.00208 21.0021C1.32357 21.3235 1.7596 21.5042 2.21426 21.5042L17.7899 21.5021C18.2446 21.5021 18.6807 21.3214 19.0021 21C19.3235 20.6786 19.5042 20.2424 19.5042 19.7878L19.5043 7.71428C19.5043 7.25963 19.3236 6.82359 19.0021 6.50211M13.0757 1.00211L19.0021 6.50211M13.0757 1.00211C13.4757 1.40211 13.5266 1.83544 13.5021 2.00211V5.50211H17.0021C18.0021 5.50211 18.6021 6.10211 19.0021 6.50211"
          stroke={props.stroke ?? '#A7B4C3'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );

  if (innerText === undefined) return icon;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {icon}
      <Box
        sx={{
          position: 'absolute',
          inset: '3px 0 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize:
            isNaN(Number(innerText)) && Number(innerText) > 99
              ? '10px'
              : '14px',
          fontWeight: 600,
          color: innerTextColor ?? '#A7B4C3',
          pointerEvents: 'none',
        }}
      >
        {innerText}
      </Box>
    </Box>
  );
}
