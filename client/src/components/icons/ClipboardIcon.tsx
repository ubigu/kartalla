import React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function ClipboardIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20.25 8.24899V5.249C20.25 4.85117 20.092 4.46964 19.8107 4.18833C19.5294 3.90703 19.1478 3.749 18.75 3.749H14.75M6.25 3.749H2.25C1.85218 3.749 1.47064 3.90703 1.18934 4.18833C0.908035 4.46964 0.75 4.85117 0.75 5.249V21.749C0.75 22.1468 0.908035 22.5283 1.18934 22.8097C1.47064 23.091 1.85218 23.249 2.25 23.249H8.25M14.25 14.249H20.25M14.25 17.249H20.25M14.25 20.249H16.5M14.421 4.736C14.3711 4.88536 14.2755 5.01525 14.1477 5.10731C14.02 5.19937 13.8665 5.24893 13.709 5.249H7.291C7.13352 5.24893 6.98004 5.19937 6.85227 5.10731C6.7245 5.01525 6.62891 4.88536 6.579 4.736L5.579 1.736C5.54121 1.62322 5.53081 1.50307 5.54868 1.38548C5.56654 1.2679 5.61216 1.15626 5.68174 1.0598C5.75132 0.96334 5.84287 0.884839 5.94882 0.830792C6.05477 0.776745 6.17206 0.748706 6.291 0.748995H14.709C14.8279 0.748706 14.9452 0.776745 15.0512 0.830792C15.1571 0.884839 15.2487 0.96334 15.3183 1.0598C15.3878 1.15626 15.4335 1.2679 15.4513 1.38548C15.4692 1.50307 15.4588 1.62322 15.421 1.736L14.421 4.736ZM11.25 11.249H23.25V23.249H11.25V11.249Z"
          stroke="currentColor"
          fill="none"
          strokeOpacity="1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
