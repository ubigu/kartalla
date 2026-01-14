import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function TextSectionIcon(props: SvgIconProps) {
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
            d="M13 1.5H8.5M13 4.5H8.5M13 7.5H8.5M13 13.5H1M13 10.5H1M1.26648 6.5L3.10837 0.97434C3.20279 0.69107 3.46788 0.5 3.76648 0.5C4.06507 0.5 4.33017 0.69107 4.42459 0.97434L6.26648 6.5M1.93311 4.5H5.59977"
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
