import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function FolderIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 14 14">
      <path
        d="M11.5 6V4.5C11.5 3.94772 11.0523 3.5 10.5 3.5H5.5L5.18937 2.25746C5.07807 1.8123 4.67809 1.5 4.21922 1.5H1.5C0.947715 1.5 0.5 1.94772 0.5 2.5V11.5C0.5 12.0523 0.947715 12.5 1.5 12.5H11.2192C11.6781 12.5 12.0781 12.1877 12.1894 11.7425L13.4867 6.55317C13.4955 6.51786 13.5 6.48159 13.5 6.44519C13.5 6.19932 13.3007 6 13.0548 6H4.77946C4.3212 6 3.92159 6.31148 3.80972 6.75587L2.99301 10"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}
