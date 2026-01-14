import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function ClipboardSmallIcon(props: SvgIconProps) {
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
            d="M2.5 1.5C2.5 2.05228 2.94772 2.5 3.5 2.5H5.5C6.05228 2.5 6.5 2.05228 6.5 1.5M2.5 1.5C2.5 0.947715 2.94772 0.5 3.5 0.5H5.5C6.05228 0.5 6.5 0.947715 6.5 1.5M2.5 1.5H1.5C0.947715 1.5 0.5 1.94772 0.5 2.5V9.5C0.5 10.0523 0.947715 10.5 1.5 10.5H4.5M6.5 1.5H7.5C8.05228 1.5 8.5 1.94772 8.5 2.5V3.5M8.5 8.25H11.5M8.5 10.75H11.5M13.5 12.5V6.5C13.5 5.94772 13.0523 5.5 12.5 5.5H7.5C6.94772 5.5 6.5 5.94772 6.5 6.5V12.5C6.5 13.0523 6.94772 13.5 7.5 13.5H12.5C13.0523 13.5 13.5 13.0523 13.5 12.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath>
            <rect width="14" height="14" fill="currentColor" />
          </clipPath>
        </defs>
      </svg>
    </SvgIcon>
  );
}
