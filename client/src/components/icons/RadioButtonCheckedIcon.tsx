import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function RadioButtonCheckedIcon(props: SvgIconProps) {
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
            d="M9.55214 2.33321C8.65794 1.80384 7.61445 1.5 6.5 1.5C3.18629 1.5 0.5 4.18629 0.5 7.5C0.5 10.8137 3.18629 13.5 6.5 13.5C9.81371 13.5 12.5 10.8137 12.5 7.5C12.5 6.75188 12.3631 6.03573 12.1129 5.37526M13.5 0.5L7.16667 8.41667L4 6.04167"
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
