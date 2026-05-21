import { UserGroup } from '@interfaces/userGroup';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
} from '@mui/material';
import ConfirmDialog from '@src/components/ConfirmDialog';
import { Input } from '@src/components/core/Input';
import DeleteBinIcon from '@src/components/icons/DeleteBinIcon';
import {
  createUserGroup,
  deleteUserGroup,
} from '@src/controllers/UserGroupController';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useUser } from '@src/stores/UserContext';
import { useState } from 'react';
import { userManagementContentPadding } from '.';

interface FormElements extends HTMLFormControlsCollection {
  groupNameInput: HTMLInputElement;
}

interface UserGroupFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

const formStyle = {
  flexDirection: 'row',
  gap: '1rem',
  alignItems: 'end',
  flex: 1,
};

const singleColumnBorderRadiusStyle = {
  borderRadius: '16px',
};

const multiColumnBorderRadiusStyle = {
  ':first-of-type': {
    borderTopLeftRadius: '16px',
    borderBottomLeftRadius: '16px',
  },

  ':last-of-type': {
    borderBottomRightRadius: '16px',
    borderTopRightRadius: '16px',
  },
};

const tableHeadStyle = (theme: Theme) => ({
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
});
const tableBodyStyle = (withMultiColumn: boolean) => ({
  overflowY: 'auto',
  '& td': {
    border: 'none',
    padding: '8px 16px',
  },
  '& tr:nth-of-type(even) > td': {
    ...(withMultiColumn
      ? multiColumnBorderRadiusStyle
      : singleColumnBorderRadiusStyle),
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  '& tr:hover > td': {
    ...(withMultiColumn
      ? multiColumnBorderRadiusStyle
      : singleColumnBorderRadiusStyle),
    backgroundColor: 'rgba(0, 0, 0, 0.08) !important',
  },
});

interface Props {
  onGroupChange: () => Promise<void>;
  onGroupDelete?: () => Promise<void>;
  availableUserGroups: UserGroup[];
}

export function UserGroupManagement(props: Props) {
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const { activeUserIsSuperUser } = useUser();
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  async function handleDeleteGroup(groupId: string) {
    try {
      await deleteUserGroup(groupId);
      props.onGroupDelete?.();
      showToast({
        message: tr.UserGroupManagement.groupDeletionComplete,
        severity: 'success',
      });
    } catch {
      showToast({
        message: tr.UserGroupManagement.groupDeletionFailed,
        severity: 'error',
      });
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        paddingX: userManagementContentPadding,
      }}
    >
      <ConfirmDialog
        open={groupToDelete !== null}
        text={tr.UserGroupManagement.groupDeletionConfirm}
        submitColor="error"
        onClose={async (confirmed) => {
          const id = groupToDelete;
          setGroupToDelete(null);
          if (confirmed && id) {
            await handleDeleteGroup(id);
          }
        }}
      />
      <FormControl
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget as UserGroupFormElement;
          const groupName = form.elements.groupNameInput.value.trim();

          if (!groupName) {
            return;
          }

          try {
            await createUserGroup(groupName);
            form.reset();
            await props.onGroupChange();
          } catch (error) {
            showToast({
              message: `${tr.UserGroupManagement.groupCreationFailed}}`,
              severity: 'error',
            });
          }
        }}
        component="form"
        sx={formStyle}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <Input
            label={tr.UserGroupManagement.addGroupLabel}
            id="groupNameInput"
          />
        </Box>

        <Button
          type="submit"
          variant="outlined"
          sx={{
            width: 'max-content',
          }}
        >
          {tr.UserGroupManagement.addGroup}
        </Button>
      </FormControl>
      <TableContainer sx={{ mb: 2, maxHeight: '30vh' }}>
        <Table
          size="small"
          sx={{
            borderCollapse: 'separate',
            borderSpacing: '0px',
          }}
        >
          <TableHead sx={tableHeadStyle}>
            <TableRow>
              <TableCell>{tr.UserGroupManagement.userGroups}</TableCell>
              {activeUserIsSuperUser && (
                <TableCell align="left">
                  {tr.UserManagement.organization}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody sx={tableBodyStyle(activeUserIsSuperUser)}>
            {props.availableUserGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    textAlign: 'center',
                    '&.MuiTableCell-root': {
                      padding: '2rem',
                    },
                  }}
                  colSpan={2}
                  align="center"
                >
                  {tr.UserGroupManagement.noGroups}
                </TableCell>
              </TableRow>
            ) : (
              props.availableUserGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Box
                      sx={{
                        color: 'rgba(37, 103, 131, 1)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {group.name}
                      {!activeUserIsSuperUser && (
                        <span style={{ marginLeft: 'auto' }}>
                          <IconButton
                            sx={{
                              ':active': {
                                color: 'error.main',
                              },
                            }}
                            onClick={() => setGroupToDelete(group.id)}
                          >
                            <DeleteBinIcon fontSize="small" />
                          </IconButton>
                        </span>
                      )}
                    </Box>
                  </TableCell>
                  {activeUserIsSuperUser && (
                    <TableCell align="left">
                      <Box display="flex" alignItems="center">
                        {group.organization}
                        <span style={{ marginLeft: 'auto' }}>
                          <IconButton
                            sx={{
                              ':active': {
                                color: 'error.main',
                              },
                            }}
                            onClick={() => setGroupToDelete(group.id)}
                          >
                            <DeleteBinIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
