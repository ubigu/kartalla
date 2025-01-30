import { User } from '@interfaces/user';
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import React from 'react';

export function UserList({
  users,
}: {
  users: { data: User[]; loading: boolean };
}) {
  const { activeUserIsSuperUser } = useUser();
  const { tr } = useTranslations();

  const userRoleMap = {
    organization_admin: tr.UserManagement.admin,
    organization_user: tr.UserManagement.regularUser,
    super_user: tr.UserManagement.superUser,
  };

  function getUserRoleLabel(roles: string[]) {
    if (roles.some((role) => role === 'super_user')) {
      return userRoleMap['super_user'];
    }
    if (roles.some((role) => role === 'organization_admin')) {
      return userRoleMap['organization_admin'];
    }
    return userRoleMap['organization_user'];
  }

  return (
    <TableContainer sx={{ overflow: 'auto' }}>
      <Table
        size="small"
        sx={{
          borderCollapse: 'separate',
          borderSpacing: '0px',
        }}
      >
        <TableHead
          sx={(theme) => ({
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1,
            outline: `2px solid ${theme.palette.primary.main}`,
            '& th': {
              border: 0,
              fontSize: '16px',
              fontWeight: 700,
            },
          })}
        >
          <TableRow>
            <TableCell>{tr.UserManagement.name}</TableCell>
            <TableCell align="left">{tr.UserManagement.email}</TableCell>
            <TableCell align="left">{tr.UserManagement.role}</TableCell>
            <TableCell align="left">{tr.UserManagement.status}</TableCell>
            {activeUserIsSuperUser && (
              <TableCell align="left">
                {tr.UserManagement.organization}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        {users.loading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Box margin={2}>
                  <CircularProgress />
                  <Typography>{tr.UserManagement.loadingTitle}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <TableBody
            sx={{
              '& td': {
                border: 'none',
                padding: '8px 16px',
              },
              '& tr:nth-of-type(even)': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '& tr:hover td': {
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
              },

              '& td:first-of-type': {
                borderLeftStyle: 'solid 1px rgba(0, 0, 0, 0.04)',
                borderTopLeftRadius: '16px',
                borderBottomLeftRadius: '16px',
              },

              '& td:last-of-type': {
                borderLeftStyle: 'solid 1px rgba(0, 0, 0, 0.04)',
                borderBottomRightRadius: '16px',
                borderTopRightRadius: '16px',
              },
            }}
          >
            {users.data.length === 0 ? (
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 700, padding: '1rem' }}
                  colSpan={3}
                  align="center"
                >
                  {tr.UserManagement.noUsers}
                </TableCell>
              </TableRow>
            ) : (
              users.data.map((user) => (
                <TableRow key={user.id} hover={true}>
                  <TableCell
                    sx={{
                      color: 'rgba(37, 103, 131, 1)',
                      fontWeight: 600,
                    }}
                  >
                    {user.fullName}
                  </TableCell>
                  <TableCell align="left">{user.email}</TableCell>
                  <TableCell align="left">
                    {getUserRoleLabel(user.roles)}
                  </TableCell>
                  <TableCell align="left">
                    {user?.isPending ? 'Odottaa' : 'Aktiivinen'}
                  </TableCell>
                  {activeUserIsSuperUser && (
                    <TableCell align="left">
                      {user.organizations.map((org) => org.name).join(', ')}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        )}
      </Table>
    </TableContainer>
  );
}
