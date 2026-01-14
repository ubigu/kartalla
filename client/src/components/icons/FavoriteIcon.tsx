import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function FavoriteIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.007 21.2741L2.57511 12.7307C-2.55093 7.60465 4.98435 -2.23735 12.007 5.7251C19.0297 -2.23735 26.5308 7.63882 21.4389 12.7307L12.007 21.2741Z"
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
