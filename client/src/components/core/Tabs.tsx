import { Tab, TabProps, Tabs, TabsProps } from '@mui/material';
import { theme } from '@src/themes/admin';

interface CoreTabsProps extends Omit<TabsProps, 'onChange'> {
  onChange?: (value: number) => void;
}

interface CoreTabProps extends TabProps {
  labelColor?: string;
}

const TAB_HEIGHT = 'min-content';
const baseTabPaddingY = 4;

export function CoreTabs({ onChange, sx, ...props }: CoreTabsProps) {
  return (
    <Tabs
      onChange={(_, value) => onChange?.(value)}
      TabIndicatorProps={{ style: { display: 'none' } }}
      sx={{
        minHeight: TAB_HEIGHT,
        height: TAB_HEIGHT,
        alignItems: 'center',
        borderBottom: `solid 1px ${theme.palette.borderSecondary.main}`,
        '& .MuiTabs-scroller': {
          overflow: 'visible !important',
        },
        '& .MuiTabs-flexContainer': {
          gap: '6px',
        },
        marginLeft: '-24px',
        marginRight: '-24px',
        paddingLeft: '24px',
        paddingRight: '24px',
        overflow: 'visible',
        ...sx,
      }}
      {...props}
    />
  );
}

export function CoreTab({ sx, labelColor, ...props }: CoreTabProps) {
  return (
    <Tab
      sx={{
        minHeight: TAB_HEIGHT,
        fontSize: '14px',
        textTransform: 'none',
        padding: `${baseTabPaddingY}px 14px`,
        background: theme.palette.surfaceInput.main,
        borderTopRightRadius: '6px',
        borderTopLeftRadius: '6px',
        boxShadow: '0px -2px 4px -1px rgba(40, 73, 87, 0.24) inset',
        borderTop: `solid 1px ${theme.palette.borderSubtle.main}`,
        borderLeft: `solid 1px ${theme.palette.borderSubtle.main}`,
        borderRight: `solid 1px ${theme.palette.borderSubtle.main}`,
        color: `${labelColor ?? theme.palette.textInteractive.main}`,
        '&.Mui-selected': {
          zIndex: 1,
          background: theme.palette.surfacePrimary.main,
          borderTop: `solid 1px ${theme.palette.borderSecondary.main}`,
          borderLeft: `solid 1px ${theme.palette.borderSecondary.main}`,
          borderRight: `solid 1px ${theme.palette.borderSecondary.main}`,
          boxShadow: 'none',
          marginBottom: '-1px',
          paddingBottom: `${baseTabPaddingY + 1}px`,
          color: `${labelColor ?? theme.palette.textInteractive.main}`,
        },

        ...sx,
      }}
      {...props}
    />
  );
}
