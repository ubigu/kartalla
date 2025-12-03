import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

/**
 * Placeholder icon for budgeting questions.
 * Uses MUI AccountBalanceWallet icon until a proper custom icon is provided by the designer.
 */
export default function BudgetingIcon(props: SvgIconProps) {
  // return <AccountBalanceWallet {...props} />;
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
          d="M8.75 5.60352C8.51158 5.53608 8.26001 5.5 8 5.5C6.48122 5.5 5.25 6.73122 5.25 8.25C5.25 9.76878 6.48122 11 8 11C8.26001 11 8.51158 10.9639 8.75 10.8965M4.25 7.25H7.25M4.25 9.25H7.25M7 13.5C10.2083 13.5 12.5 12.2619 12.5 9.50614C12.5 6.51075 11.125 4.51382 8.375 3.01613L9.45667 1.49846C9.51162 1.39889 9.54142 1.28526 9.54306 1.16909C9.5447 1.05292 9.51812 0.938348 9.466 0.836979C9.41389 0.73561 9.33809 0.651051 9.2463 0.591872C9.15451 0.532693 9.04999 0.500998 8.94333 0.5H5.05667C4.95001 0.500998 4.84549 0.532693 4.7537 0.591872C4.66191 0.651051 4.58611 0.73561 4.534 0.836979C4.48188 0.938348 4.4553 1.05292 4.45694 1.16909C4.45858 1.28526 4.48838 1.39889 4.54333 1.49846L5.625 3.02611C2.875 4.53379 1.5 6.53072 1.5 9.52611C1.5 12.2619 3.79167 13.5 7 13.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
