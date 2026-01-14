import { Link, ListItem } from '@mui/material';
import { makeStyles } from '@mui/styles';
import OpenInNewIcon from '@src/components/icons/OpenInNewIcon';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface Props {
  to: string;
  external?: boolean;
  newTab?: boolean;
  children: ReactNode;
}

const useStyles = makeStyles({
  item: {
    '&:not(.Mui-selected)': {
      backgroundColor: '#333',
    },
  },
});

export default function ListItemLink(props: Props) {
  const classes = useStyles();
  return (
    <ListItem
      button
      className={classes.item}
      component={props.external ? Link : NavLink}
      {...(!props.external && {
        to: props.to,
        activeClassName: 'Mui-selected',
      })}
      {...(props.external && { href: props.to })}
      {...(props.newTab
        ? {
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        : {})}
    >
      {props.children}
      {props.newTab && <OpenInNewIcon />}
    </ListItem>
  );
}
