import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function MapGridIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 14 14">
      <g clipPath="url(#clip0_6271_1521)">
        <path
          d="M5 1L1.75746 1.81063C1.3123 1.92193 1 2.32191 1 2.78078V11.7192C1 12.3698 1.61139 12.8472 2.24254 12.6894L5 12M5 1L9 2M5 1V12M9 2L11.7575 1.31063C12.3886 1.15285 13 1.6302 13 2.28078V11.2192C13 11.6781 12.6877 12.0781 12.2425 12.1894L9 13M9 2V13M9 13L5 12M1 7.5L5 6.5L9 7.5L13 6.5"
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_6271_1521">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}
