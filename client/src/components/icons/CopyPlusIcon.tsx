import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function CopyPlusIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 12 12">
      <path
        d="M0.5 7.78571V1.35714C0.5 0.88376 0.88376 0.5 1.35714 0.5H7.78571M4.57143 6.71429H8.85714M6.71429 4.57143V8.85714M10.7857 9.92857V3.5C10.7857 3.02662 10.402 2.64286 9.92857 2.64286H3.5C3.02662 2.64286 2.64286 3.02662 2.64286 3.5V9.92857C2.64286 10.402 3.02662 10.7857 3.5 10.7857H9.92857C10.402 10.7857 10.7857 10.402 10.7857 9.92857Z"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
