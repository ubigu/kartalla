import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function LinkSmallIcon(props: SvgIconProps) {
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
        <path d="M5 9L9 5M3.03553 5.96448L1.53553 7.46448C0.154823 8.84519 0.154823 11.0838 1.53553 12.4645C2.91625 13.8452 5.15482 13.8452 6.53554 12.4645L8.03553 10.9645M10.9644 8.03553L12.4644 6.53553C13.8451 5.15482 13.8451 2.91625 12.4644 1.53553C11.0836 0.154822 8.84507 0.154824 7.46435 1.53553L5.96436 3.03553" />
      </svg>
    </SvgIcon>
  );
}
