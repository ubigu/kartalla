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
import { useTranslations } from '@src/stores/TranslationContext';
import { useHistory } from 'react-router-dom';
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
              height: '50px',
              '& li': {
                padding: '0',
              },
              'li+li': {
                borderLeft: '1px solid #FFFFFF',
                marginLeft: '10px',
                paddingLeft: '10px',
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
                  component="p"
                  variant="mainHeader"
                  sx={{
                    textOverflow: 'ellipsis',
                    color: 'white',
                    fontSize: '24px',
                  }}
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
