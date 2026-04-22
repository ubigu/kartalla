import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function DragHandleIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 14 14" {...props}>
      <path
        d="M6 3V5H8M6 9V11H8"
        stroke="#A7B4C3"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
