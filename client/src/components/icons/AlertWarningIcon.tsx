import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function AlertWarningIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 14 14" {...props}>
      <path
        d="M7 4V7.25M7 9.5C6.86193 9.5 6.75 9.61193 6.75 9.75C6.75 9.88807 6.86193 10 7 10C7.13807 10 7.25 9.88807 7.25 9.75C7.25 9.61193 7.13807 9.51 7 9.51M1 2V12C1 12.5523 1.44772 13 2 13H12C12.5523 13 13 12.5523 13 12V2C13 1.44771 12.5523 1 12 1H2C1.44772 1 1 1.44772 1 2Z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
