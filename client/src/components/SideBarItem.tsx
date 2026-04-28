import { Link, ListItemButton, Theme } from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type BaseProps = {
  children: ReactNode;
  backgroundColor?: string;
  sxProps?: SystemStyleObject<Theme>;
  disabled?: boolean;
};

type LinkProps = BaseProps & {
  to: string;
  external?: boolean;
  newTab?: boolean;
  onClick?: never;
};

type ButtonProps = BaseProps & {
  to?: never;
  external?: never;
  newTab?: never;
  onClick?: () => void | Promise<void>;
};

type Props = LinkProps | ButtonProps;

export const SIDEBAR_ITEM_HEIGHT = 38;
export const SIDEBAR_PAGE_ICON_CLASS = 'sidebar-page-icon';

const itemSx = (backgroundColor?: string) => (theme: Theme) => ({
  display: 'flex',
  gap: '6px',
  height: SIDEBAR_ITEM_HEIGHT,
  minWidth: 0,
  border: `solid 1px ${theme.palette.borderSubtle.main}`,
  '& .MuiListItemText-root > *': {
    fontSize: '14px',
    fontWeight: 600,
  },
  '&:not(.Mui-selected)': {
    backgroundColor: backgroundColor ?? theme.palette.surfacePrimary.main,
  },
  '& svg': {
    color: theme.palette.primary.main,
  },
  [`& svg:not(.${SIDEBAR_PAGE_ICON_CLASS})`]: {
    fontSize: '13px',
  },
  '&.Mui-selected': {
    '& *': { fontWeight: 700, color: 'textSecondary.main' },
    backgroundColor: theme.palette.surfaceInfo.main,
  },
  '&:hover, &.Mui-selected:hover': {
    backgroundColor: theme.palette.surfaceInfo.main,
  },
});

export default function SideBarItem(props: Props) {
  return (
    <ListItemButton
      disabled={props.disabled}
      sx={(theme) => ({
        ...itemSx(props.backgroundColor)(theme),
        ...(props.sxProps ?? {}),
      })}
      {...(props.to
        ? props.external
          ? {
              component: Link,
              href: props.to,
              ...(props.newTab
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {}),
            }
          : {
              component: NavLink,
              to: props.to,
              activeClassName: 'Mui-selected',
            }
        : { onClick: props.onClick })}
    >
      {props.children}
    </ListItemButton>
  );
}
