import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function SliderIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.5 7C7.5 8.10457 6.60457 9 5.5 9C4.39543 9 3.5 8.10457 3.5 7M7.5 7C7.5 5.89543 6.60457 5 5.5 5C4.39543 5 3.5 5.89543 3.5 7M7.5 7H13.5M3.5 7H0.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
