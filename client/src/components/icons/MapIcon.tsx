import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function MapIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path
            d="M8.5 1.5V4M8.5 1.5L11.2575 0.810634C11.8886 0.652847 12.5 1.13021 12.5 1.78078V4M8.5 1.5L4.5 0.5M4.5 0.5V11.5M4.5 0.5L1.25746 1.31063C0.812297 1.42193 0.5 1.82191 0.5 2.28078V11.2192C0.5 11.8698 1.11139 12.3472 1.74254 12.1894L4.5 11.5M4.5 11.5L6.2417 11.9354M13.5 9C13.5 11.5 10.5 13.5 10.5 13.5C10.5 13.5 7.5 11.5 7.5 9C7.5 7.34315 8.84315 6 10.5 6C12.1569 6 13.5 7.34315 13.5 9ZM10.5 9.5C10.7761 9.5 11 9.27614 11 9C11 8.72386 10.7761 8.5 10.5 8.5C10.2239 8.5 10 8.72386 10 9C10 9.27614 10.2239 9.5 10.5 9.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath>
            <rect width="14" height="14" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </SvgIcon>
  );
}
