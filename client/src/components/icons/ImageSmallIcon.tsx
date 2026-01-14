import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function ImageSmallIcon(props: SvgIconProps) {
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
          d="M11.5823 12.4958L4.85382 5.76733L1.5 9.12115M9.25 6.25C8.42157 6.25 7.75 5.57843 7.75 4.75C7.75 3.92157 8.42157 3.25 9.25 3.25C10.0784 3.25 10.75 3.92157 10.75 4.75C10.75 5.57843 10.0784 6.25 9.25 6.25ZM11.5 12.5H2.5C1.9902 12.5 1.5 12.0098 1.5 11.5V2.5C1.5 1.9902 1.9902 1.5 2.5 1.5H11.5C12.0098 1.5 12.5 1.9902 12.5 2.5V11.5C12.5 12.0098 12.0098 12.5 11.5 12.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
