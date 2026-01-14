import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function LanguageIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0.75 12C0.75 14.9837 1.93526 17.8452 4.04505 19.955C6.15483 22.0647 9.01631 23.25 12 23.25C14.9837 23.25 17.8452 22.0647 19.955 19.955C22.0647 17.8452 23.25 14.9837 23.25 12M0.75 12C0.75 9.01631 1.93526 6.15483 4.04505 4.04505C6.15483 1.93526 9.01631 0.75 12 0.75C14.9837 0.75 17.8452 1.93526 19.955 4.04505C22.0647 6.15483 23.25 9.01631 23.25 12M0.75 12H23.25M9.88 23.05C8.31 20.85 7.25 16.72 7.25 12.05C7.25 7.38 8.31 3.15 9.88 1M14.12 23.05C15.69 20.85 16.75 16.72 16.75 12.05C16.75 7.38 15.69 3.15 14.12 1M2.05 17.25H21.95M2.05 6.75H21.95"
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
