import {
  AppBar,
  IconButton,
  List,
  ListItem,
  Theme,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import KartallaLogo from '@src/components/icons/KartallaLogoDense';
import LogoutIcon from '@src/components/icons/LogoutIcon';
import { useHistory } from 'react-router-dom';
import { useTranslations } from '@src/stores/TranslationContext';
import LanguageMenu from '../LanguageMenu';
import SurveyLanguageMenu from '../SurveyLanguageMenu';
import AppBarUserMenu from './AppBarUserMenu';
import { GeneralNotificationNavigationButton } from './GeneralNotification/GeneralNotificationNavigationButton';
import { AppBarInstructionsMenu } from './Instructions/AppBarInstructionsMenu';

interface Props {
  labels?: string[];
  withHomeLink?: boolean;
  style?: SystemStyleObject<Theme>;
}

export function AdminAppBar({
  labels = [],
  withHomeLink = true,
  style = {},
}: Props) {
  const history = useHistory();
  const { tr } = useTranslations();

  return (
    <>
      <AppBar position="fixed">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <List
            sx={{
              ...style,
              display: 'flex',
              flexWrap: 'nowrap',
              color: 'white',
              '& li': {
                padding: '0',
              },
              'li+li::before': {
                content: '" • "',
                padding: '0px 10px',
                lineHeight: 1.6,
                fontSize: '1.25rem',
              },
            }}
          >
            {withHomeLink && (
              <ListItem>
                <IconButton
                  onClick={() => history.push('/')}
                  sx={{
                    padding: 0,
                    width: '140px',
                    transform: 'translateY(-2px)',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      opacity: 0.6,
                    },
                  }}
                >
                  <KartallaLogo />
                </IconButton>
              </ListItem>
            )}
            {labels.map((item, index) => (
              <ListItem
                key={`${item}-${index}`}
                sx={{ maxWidth: index === 0 ? '300px' : 'auto' }}
              >
                <Typography
                  noWrap
                  variant="subtitle1"
                  component="p"
                  sx={{ textOverflow: 'ellipsis', color: 'white' }}
                  title={item}
                >
                  {item}
                </Typography>
              </ListItem>
            ))}
          </List>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifySelf: 'flex-end',
              gap: '0.25rem',
            }}
          >
            <SurveyLanguageMenu />
            <LanguageMenu />
            <GeneralNotificationNavigationButton />
            <AppBarInstructionsMenu />
            <AppBarUserMenu />
            <Tooltip arrow title={tr.AppBarUserMenu.logout}>
              <IconButton
                aria-label={tr.AppBarUserMenu.logout}
                color="inherit"
                onClick={() => {
                  window.location.pathname = '/logout';
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </div>
        </Toolbar>
      </AppBar>
      {/* Additional toolbar for preventing content going under appbar */}
      <Toolbar />
    </>
  );
}
