import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function BlockIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 12 12">
      <path
        d="M9.94288 9.94288L2.05713 2.05718M6.00002 11.5714C2.923 11.5714 0.428589 9.07707 0.428589 6.00002C0.428589 2.923 2.923 0.428589 6.00002 0.428589C9.07707 0.428589 11.5714 2.923 11.5714 6.00002C11.5714 9.07707 9.07707 11.5714 6.00002 11.5714Z"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
