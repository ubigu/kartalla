import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import React from 'react';

export function ImageCheckIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <g clipPath="url(#clip0_5768_16)">
          <path
            d="M5.5 10.5H1.5C1.23478 10.5 0.98043 10.3946 0.792893 10.2071C0.605357 10.0196 0.5 9.76522 0.5 9.5V1.5C0.5 1.23478 0.605357 0.98043 0.792893 0.792893C0.98043 0.605357 1.23478 0.5 1.5 0.5H9.5C9.76522 0.5 10.0196 0.605357 10.2071 0.792893C10.3946 0.98043 10.5 1.23478 10.5 1.5V7M0.5 7.07343L3.10468 4.46875L7.5 8.86407M13.5 8.5L9.5 13.5L7.5 12M7.125 4.875C6.43464 4.875 5.875 4.31536 5.875 3.625C5.875 2.93464 6.43464 2.375 7.125 2.375C7.81536 2.375 8.375 2.93464 8.375 3.625C8.375 4.31536 7.81536 4.875 7.125 4.875Z"
            stroke={props.htmlColor ?? 'currentColor'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_5768_16">
            <rect
              width="14"
              height="14"
              fill="white"
              style={{ fill: 'white', fillOpacity: 1 }}
            />
          </clipPath>
        </defs>
      </svg>
    </SvgIcon>
  );
}
