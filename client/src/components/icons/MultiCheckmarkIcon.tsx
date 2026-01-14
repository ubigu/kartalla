import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function MultiCheckmarkIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.04547 8.0946C0.406441 7.5674 0.315785 6.62199 0.842982 5.98297C1.37018 5.34394 2.31559 5.25328 2.95462 5.78048M10.4447 1.66829C9.80126 1.14654 8.85665 1.24523 8.33491 1.88872L5.5 5.38511M12.9447 3.66829C13.5882 4.19003 13.6869 5.13464 13.1652 5.77813L8.80035 11.1614C7.92555 12.2403 6.33896 12.3993 5.26751 11.5153L3.54547 10.0946C2.90644 9.56745 2.81578 8.62204 3.34298 7.98302C3.87018 7.34399 4.81559 7.25333 5.45462 7.78053L6.78768 8.88031L10.8349 3.88872C11.3567 3.24523 12.3013 3.14654 12.9447 3.66829Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
