import React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function HierarchyIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.14265 6H8.57122M8.57122 10.2857H7.71408C7.24069 10.2857 6.85693 9.90197 6.85693 9.42857V2.57143C6.85693 2.09805 7.24069 1.71429 7.71408 1.71429H8.57122M4.71408 8.35714H1.28551C1.04881 8.35714 0.856934 8.16526 0.856934 7.92857V4.07143C0.856934 3.83474 1.04881 3.64286 1.28551 3.64286H4.71408C4.95077 3.64286 5.14265 3.83474 5.14265 4.07143V7.92857C5.14265 8.16526 4.95077 8.35714 4.71408 8.35714ZM10.7141 11.5714H8.99979C8.76313 11.5714 8.57122 11.3795 8.57122 11.1429V9.42857C8.57122 9.19191 8.76313 9 8.99979 9H10.7141C10.9507 9 11.1426 9.19191 11.1426 9.42857V11.1429C11.1426 11.3795 10.9507 11.5714 10.7141 11.5714ZM10.7141 7.28571H8.99979C8.76313 7.28571 8.57122 7.09383 8.57122 6.85714V5.14286C8.57122 4.90617 8.76313 4.71429 8.99979 4.71429H10.7141C10.9507 4.71429 11.1426 4.90617 11.1426 5.14286V6.85714C11.1426 7.09383 10.9507 7.28571 10.7141 7.28571ZM10.7141 3H8.99979C8.76313 3 8.57122 2.80812 8.57122 2.57143V0.857143C8.57122 0.620449 8.76313 0.428571 8.99979 0.428571H10.7141C10.9507 0.428571 11.1426 0.620449 11.1426 0.857143V2.57143C11.1426 2.80812 10.9507 3 10.7141 3Z"
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}