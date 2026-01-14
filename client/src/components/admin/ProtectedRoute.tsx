import { Box, CircularProgress } from '@mui/material';
import { useUser } from '@src/stores/UserContext';

import { PropsWithChildren } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

/**
 * A route that is only accessible to admin or super users.
 * If the user is not an admin nor a super user, they are redirected to the login page.
 */
export function ProtectedRoute(props: PropsWithChildren<RouteProps>) {
  const { activeUserIsAdmin, activeUserIsSuperUser, isInitialized } = useUser();

  if (!isInitialized) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        sx={{ gap: '1rem' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!activeUserIsAdmin && !activeUserIsSuperUser) {
    return <Redirect to="/admin" />;
  }
  return <Route {...props}>{props.children}</Route>;
}
