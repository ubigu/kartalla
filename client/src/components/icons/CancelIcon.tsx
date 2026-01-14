import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function CancelIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.5 16.499L16.5 7.49899M16.5 16.499L7.5 7.49899M0.75 11.999C0.75 14.9827 1.93526 17.8442 4.04505 19.9539C6.15483 22.0637 9.01631 23.249 12 23.249C14.9837 23.249 17.8452 22.0637 19.955 19.9539C22.0647 17.8442 23.25 14.9827 23.25 11.999C23.25 9.01531 22.0647 6.15383 19.955 4.04404C17.8452 1.93426 14.9837 0.748993 12 0.748993C9.01631 0.748993 6.15483 1.93426 4.04505 4.04404C1.93526 6.15383 0.75 9.01531 0.75 11.999Z"
          stroke="currentColor"
          fill="none"
          strokeOpacity="1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
