import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function ChevronDownSmallIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} style={{ fontSize: 14 }}>
      <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0.699997 3.85001L6.5044 9.94001C6.56942 10.0052 6.64667 10.0569 6.73171 10.0922C6.81675 10.1275 6.90792 10.1457 7 10.1457C7.09207 10.1457 7.18324 10.1275 7.26828 10.0922C7.35333 10.0569 7.43057 10.0052 7.4956 9.94001L13.3 3.85001"
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
