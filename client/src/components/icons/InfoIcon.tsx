import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function InfoIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14.25 16.5H13.5C13.1022 16.5 12.7206 16.342 12.4393 16.0607C12.158 15.7794 12 15.3978 12 15V11.25C12 11.0511 11.921 10.8603 11.7803 10.7197C11.6397 10.579 11.4489 10.5 11.25 10.5H10.5M11.625 6.74451C11.4179 6.74451 11.25 6.9124 11.25 7.11951C11.25 7.32662 11.4179 7.49451 11.625 7.49451C11.8321 7.49451 12 7.32662 12 7.11951C12 6.9124 11.8421 6.74451 11.635 6.74451M12 23.25C18.2132 23.25 23.25 18.2132 23.25 12C23.25 5.7868 18.2132 0.75 12 0.75C5.7868 0.75 0.75 5.7868 0.75 12C0.75 18.2132 5.7868 23.25 12 23.25Z"
          stroke="white"
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
