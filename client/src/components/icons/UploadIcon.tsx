import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function UploadIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6.75 6.75H3.75C3.35218 6.75 2.97064 6.90804 2.68934 7.18934C2.40804 7.47064 2.25 7.85218 2.25 8.25V18C2.25 18.3978 2.40804 18.7794 2.68934 19.0607C2.97064 19.342 3.35218 19.5 3.75 19.5H20.25C20.6478 19.5 21.0294 19.342 21.3107 19.0607C21.592 18.7794 21.75 18.3978 21.75 18V8.25C21.75 7.85218 21.592 7.47064 21.3107 7.18934C21.0294 6.90804 20.6478 6.75 20.25 6.75H17.25M12 19.5V23.25M8.25 23.25H15.75M2.25 16H21.75M15 3.75L12 0.75M12 0.75L9 3.75M12 0.75V12.75"
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
