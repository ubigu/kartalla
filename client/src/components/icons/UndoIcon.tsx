import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function UndoIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0.75 0.748004V8.248H8.25M12 23.248C14.0628 23.2492 16.0862 22.6833 17.849 21.612C19.6118 20.5408 21.0461 19.0055 21.9952 17.174C22.9442 15.3426 23.3715 13.2854 23.2302 11.2275C23.0889 9.16957 22.3845 7.1901 21.1941 5.50551C20.0036 3.82092 18.373 2.49606 16.4803 1.67577C14.5876 0.855489 12.5059 0.571362 10.4627 0.854456C8.4194 1.13755 6.49332 1.97697 4.89498 3.28093C3.29665 4.5849 2.08759 6.30321 1.4 8.248"
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
