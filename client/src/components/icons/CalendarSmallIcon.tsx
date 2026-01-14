import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function CalendarSmallIcon(props: SvgIconProps) {
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
        <path d="M3.5 0.699997V3.5M10.5 0.699997V3.5M0.700001 6.3H13.3M11.9 2.1H2.1C1.7287 2.1 1.3726 2.2475 1.11005 2.51005C0.8475 2.7726 0.700001 3.12869 0.700001 3.5V11.9C0.700001 12.2713 0.8475 12.6274 1.11005 12.8899C1.3726 13.1525 1.7287 13.3 2.1 13.3H11.9C12.2713 13.3 12.6274 13.1525 12.89 12.8899C13.1525 12.6274 13.3 12.2713 13.3 11.9V3.5C13.3 3.12869 13.1525 2.7726 12.89 2.51005C12.6274 2.2475 12.2713 2.1 11.9 2.1Z" />
      </svg>
    </SvgIcon>
  );
}
