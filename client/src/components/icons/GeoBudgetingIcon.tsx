import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

/**
 * Placeholder icon for geo-budgeting questions.
 * Uses MUI Room icon until a proper custom icon is provided by the designer.
 */
export default function GeoBudgetingIcon(props: SvgIconProps) {
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
          d="M8.5 3.60352C8.26158 3.53608 8.01001 3.5 7.75 3.5C6.23122 3.5 5 4.73122 5 6.25C5 7.76878 6.23122 9 7.75 9C8.01001 9 8.26158 8.9639 8.5 8.8965M4 5.25H7M4 7.25H7M12.5 6C12.5 9.52712 8.41793 12.6655 7.45277 13.3582C7.32034 13.4533 7.16301 13.5 7 13.5C6.83699 13.5 6.67966 13.4533 6.54723 13.3582C5.58207 12.6655 1.5 9.52712 1.5 6C1.5 2.96243 3.96243 0.5 7 0.5C10.0376 0.5 12.5 2.96243 12.5 6Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
