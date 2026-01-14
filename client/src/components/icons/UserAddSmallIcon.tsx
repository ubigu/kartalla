import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function UserAddSmallIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <g clipPath="url(#clip0_4701_1540)">
          <path
            d="M10.75 8V13.5M8 10.75H13.5M6.75 12.5H0.5V12C0.5 9.51472 2.51472 7.5 5 7.5C6.11303 7.5 7.13167 7.90409 7.91724 8.57356M5 5.5C6.38071 5.5 7.5 4.38071 7.5 3C7.5 1.61929 6.38071 0.5 5 0.5C3.61929 0.5 2.5 1.61929 2.5 3C2.5 4.38071 3.61929 5.5 5 5.5Z"
            stroke="#00A393"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_4701_1540">
            <rect width="14" height="14" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </SvgIcon>
  );
}
