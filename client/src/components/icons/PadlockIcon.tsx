import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function PadlockIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 14 14">
      <path
        d="M10.5 5.5V4C10.5 3.07174 10.1313 2.1815 9.47487 1.52513C8.8185 0.868749 7.92826 0.5 7 0.5C6.07174 0.5 5.1815 0.868749 4.52513 1.52513C3.86875 2.1815 3.5 3.07174 3.5 4V5.5M11.5 5.5H2.5C1.94772 5.5 1.5 5.94772 1.5 6.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H11.5C12.0523 13.5 12.5 13.0523 12.5 12.5V6.5C12.5 5.94772 12.0523 5.5 11.5 5.5ZM7 10C7.27614 10 7.5 9.77614 7.5 9.5C7.5 9.22386 7.27614 9 7 9C6.72386 9 6.5 9.22386 6.5 9.5C6.5 9.77614 6.72386 10 7 10Z"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
