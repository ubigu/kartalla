import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function FileCopyIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0.993042 3.6464V1.93148C0.993042 1.3792 1.44075 0.931488 1.99304 0.931488H3.70796M0.993042 8.21439V11.554M8.27595 0.931488H11.6155M16.1302 0.931488H17.7266C18.2788 0.931488 18.7266 1.3792 18.7266 1.93148V3.6464M0.993042 16.0687V17.665C0.993042 18.2173 1.44075 18.665 1.99304 18.665H3.70796M23.0078 22.0684C23.0078 22.6206 22.5601 23.0684 22.0078 23.0684H7.27736C6.72508 23.0684 6.27736 22.6206 6.27736 22.0684V7.33788C6.27736 6.7856 6.72508 6.33788 7.27736 6.33788H22.0078C22.5601 6.33788 23.0078 6.7856 23.0078 7.33788V22.0684Z"
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
