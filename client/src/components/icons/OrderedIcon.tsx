import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function OrderedIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path
            d="M10.9198 5.5298V0.630005C10.9198 1.3065 10.3714 1.8549 9.69488 1.8549H9.28658M12.5532 5.5298H9.28668M12.2265 9.5109V12.2138C12.2265 12.9242 11.6507 13.5 10.9403 13.5H10.0829C9.52278 13.5 9.04638 13.1421 8.86988 12.6426M6.34658 10.9201L3.89668 13.37M3.89668 13.37L1.44678 10.9201M3.89668 13.37V0.630505M10.1902 11.0115H10.8333C11.6028 11.0115 12.2266 10.3877 12.2266 9.6181C12.2266 8.8486 11.6028 8.2247 10.8333 8.2247H10.1902C9.42058 8.2247 8.79678 8.8486 8.79678 9.6181C8.79678 10.3877 9.42058 11.0115 10.1902 11.0115Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath>
            <rect width="14" height="14" fill="currentColor" />
          </clipPath>
        </defs>
      </svg>
    </SvgIcon>
  );
}
