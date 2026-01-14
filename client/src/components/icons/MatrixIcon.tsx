import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function MatrixIcon(props: SvgIconProps) {
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
          d="M4.5 1.5L4.5 12.5M1.5 9.5H12.5M1.5 5.5H12.5M2.5 1.5H11.5C12.0523 1.5 12.5 1.94772 12.5 2.5V11.5C12.5 12.0523 12.0523 12.5 11.5 12.5H2.5C1.94771 12.5 1.5 12.0523 1.5 11.5V2.5C1.5 1.94772 1.94771 1.5 2.5 1.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
