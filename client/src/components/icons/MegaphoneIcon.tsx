import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

export function MegaphoneIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.75 15.25H4.5C3.50544 15.25 2.55161 14.8549 1.84835 14.1517C1.14509 13.4484 0.75 12.4946 0.75 11.5C0.75 10.5054 1.14509 9.55161 1.84835 8.84835C2.55161 8.14509 3.50544 7.75 4.5 7.75H6.75M6.75 15.25V7.75M6.75 15.25C11.1511 15.2504 15.4538 16.5531 19.116 18.994L20.25 19.75V3.25L19.116 4.006C15.4538 6.44694 11.1511 7.74963 6.75 7.75M6.75 15.25C6.74936 16.2319 6.9485 17.2037 7.33531 18.1063C7.72211 19.0088 8.2885 19.8233 9 20.5M23.25 10V13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
