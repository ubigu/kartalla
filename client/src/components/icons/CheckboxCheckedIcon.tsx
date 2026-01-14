import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function CheckboxCheckedIcon(props: SvgIconProps) {
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
          d="M9.7501 1.5H2.49999C1.94771 1.5 1.5 1.94772 1.5 2.5L1.5001 12C1.5001 12.5523 1.94772 13 2.5 13H11.5C12.0523 13 12.5001 12.5523 12.5001 12V5M3.69566 5.9773L7.02232 8.47229L13.0001 1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
