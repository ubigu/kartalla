import { UserGroup } from '@interfaces/userGroup';
import {
  Box,
  Checkbox,
  IconButton,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
} from '@mui/material';
import CancelIcon from '@src/components/icons/CancelIcon';
import SaveIcon from '@src/components/icons/SaveIcon';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';

import { useEffect, useState } from 'react';

interface Props {
  selectedGroups: string[];
  userId: string;
  availableUserGroups: UserGroup[];
  forPendingUser: boolean;
}

export function UserGroupSelect(props: Props) {
  const [userGroups, setUserGroups] = useState(props.selectedGroups);
  const [modifying, setModifying] = useState(false);
  const { showToast } = useToasts();
  const { tr } = useTranslations();

  useEffect(() => {
    setUserGroups(props.selectedGroups);
  }, [props.selectedGroups]);

  async function updateUserGroups(userId: string, groupIds: string[]) {
    try {
      await request(
        `/api/users/${userId}/${
          props.forPendingUser ? 'pending-groups' : 'groups'
        }`,
        {
          method: 'POST',
          body: { groups: groupIds },
        },
      );
      showToast({
        severity: 'success',
        message: tr.UserGroupSelect.updateSuccess,
      });
      setModifying(false);
    } catch {
      showToast({
        severity: 'error',
        message: tr.UserGroupSelect.updateFailed,
      });
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '300px' }}>
      <Select
        size="small"
        multiple
        sx={{
          fontSize: '0.875rem',
          minWidth: '210px',
        }}
        id="userRightsSelect"
        value={userGroups}
        onChange={(event) => {
          setModifying(true);
          setUserGroups(event.target.value as string[]);
        }}
        displayEmpty
        renderValue={(props) => {
          return props.length > 0 ? (
            <div>{props.length} käyttäjäryhmää valittu</div>
          ) : (
            <div>Ei valittuja käyttäjäryhmiä</div>
          );
        }}
      >
        {props.availableUserGroups.map((group) => (
          <MenuItem key={group.id} value={group.id}>
            <Checkbox checked={userGroups.includes(group.id)} />
            <ListItemText>{group.name}</ListItemText>
          </MenuItem>
        ))}
      </Select>
      {modifying && (
        <Box display="flex" marginLeft="auto">
          <Tooltip title={tr.commands.discard}>
            <IconButton
              onClick={() => {
                setUserGroups(props.selectedGroups);
                setModifying(false);
              }}
              sx={{
                color: 'error.main',
              }}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr.commands.save}>
            <IconButton
              onClick={async () => {
                await updateUserGroups(props.userId, userGroups);
              }}
              sx={{
                color: 'primary.main',
              }}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
