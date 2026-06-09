import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { useId } from 'react';

export default function ArrowLeftIcon(props: SvgIconProps) {
  const clipPathId = useId();
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M23.25 12H0.75"
          stroke="currentColor"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.25 1.5L0.75 12L11.25 22.5"
          stroke="currentColor"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}
