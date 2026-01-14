import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function CheckIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M23.25 0.748993L8.158 22.308C7.95888 22.5941 7.69461 22.8288 7.38698 22.9928C7.07934 23.1568 6.73715 23.2453 6.3886 23.251C6.04005 23.2568 5.69512 23.1796 5.38224 23.0259C5.06935 22.8722 4.79747 22.6464 4.589 22.367L0.75 17.249"
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
