import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function UserSmallIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        viewBox="0 0 14 14"
        stroke="currentColor"
        fill="none"
        strokeOpacity="1"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M7 7C8.65685 7 10 5.65685 10 4C10 2.34315 8.65685 1 7 1C5.34315 1 4 2.34315 4 4C4 5.65685 5.34315 7 7 7Z" />
        <path d="M6.99988 9C4.29593 9 1.97761 10.651 0.998047 13H13.0017C12.0222 10.651 9.70383 9 6.99988 9Z" />
      </svg>
    </SvgIcon>
  );
}
