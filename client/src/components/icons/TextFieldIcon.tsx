import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function TextFieldIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 8.5H7M4.5 5.5V8.5M3 5.5H6M12.5 2.5H1.5C0.947715 2.5 0.5 2.94772 0.5 3.5V10.5C0.5 11.0523 0.947715 11.5 1.5 11.5H12.5C13.0523 11.5 13.5 11.0523 13.5 10.5V3.5C13.5 2.94772 13.0523 2.5 12.5 2.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
