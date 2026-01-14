import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  useTheme,
} from '@mui/material';
import ChevronDownSmallIcon from '@src/components/icons/ChevronDownSmallIcon';
import UserAddSmallIcon from '@src/components/icons/UserAddSmallIcon';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { FormEvent, useState } from 'react';

interface FormElements extends HTMLFormControlsCollection {
  userName: HTMLInputElement;
  userEmail: HTMLInputElement;
  userRightsSelect: HTMLSelectElement;
}
interface UsernameFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

export function NewUserRequest({
  onSubmitSuccess,
}: {
  onSubmitSuccess: () => Promise<void>;
}) {
  const theme = useTheme();
  const { showToast } = useToasts();
  const { tr } = useTranslations();
  const [selectedRole, setSelectedRole] = useState('');

  async function newUserRequest(newUser: {
    name: string;
    email: string;
    role: string;
  }) {
    try {
      const result = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }),
      });
      if (result.ok) {
        showToast({
          message: tr.UserManagement.userRequestComplete,
          severity: 'success',
        });
        onSubmitSuccess();
      } else {
        const error = await result.json();
        if (error.info === 'user_exists') {
          throw new Error(tr.UserManagement.userExists);
        }
        throw new Error(tr.UserManagement.userRequestFailed);
      }
    } catch (e) {
      showToast({ message: e.message, severity: 'error' });
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        padding: '1rem 0',
        '& label': {
          fontSize: '12px',
          color: 'primary.main',
        },
        '& button, & input, & .MuiInputBase-root': {
          boxShadow: '0px -1px 2px 0px rgba(89, 120, 134, 0.15)',
          backgroundColor: '#F6F8FA',
          border: '0.5px solid #E9ECEF',
          borderRadius: '4px',
          height: '28px',
          fontSize: '14px',
        },
        '& input': {
          padding: '0 0.25rem',
          '&:focus': {
            border: `solid 2px ${theme.palette.primary.main}`,
            outline: 'none',
          },
        },
      }}
    >
      <FormControl
        onSubmit={async (e: FormEvent<UsernameFormElement>) => {
          const currentTarget = e.currentTarget;
          e.preventDefault();

          if (!e.currentTarget.checkValidity() || !selectedRole) {
            return;
          }

          await newUserRequest({
            name: currentTarget.elements.userName.value,
            email: currentTarget.elements.userEmail.value,
            role: selectedRole,
          });
          currentTarget.reset();
          setSelectedRole('');
        }}
        component="form"
        sx={{
          maxWidth: '1000px',
          flexDirection: 'row',
          gap: '1rem',
          alignItems: 'end',
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            flex: 1,
          }}
        >
          <label htmlFor="userName">{tr.UserManagement.name}</label>
          <input
            id="userName"
            type="text"
            required
            minLength={3}
            maxLength={50}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            flex: 1,
          }}
        >
          <label htmlFor="userEmail">{tr.UserManagement.email}</label>
          <input
            id="userEmail"
            type="email"
            required
            minLength={3}
            maxLength={75}
          />
        </Box>

        <FormControl
          sx={{
            flex: 1,
            gap: '0.25rem',
          }}
        >
          <label htmlFor="userRightsSelect">{tr.UserManagement.role}</label>
          <Select
            required
            sx={{
              '& .MuiSvgIcon-root': { color: theme.palette.primary.main },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '0',
              },
            }}
            id="userRightsSelect"
            onChange={(e) => setSelectedRole(e.target.value as string)}
            value={selectedRole}
            IconComponent={(props) => <ChevronDownSmallIcon {...props} />}
          >
            <MenuItem value={'organization_user'}>
              {tr.UserManagement.regularUser}
            </MenuItem>
            <MenuItem value={'organization_admin'}>
              {tr.UserManagement.admin}
            </MenuItem>
          </Select>
        </FormControl>
        <Button
          sx={{
            width: 'max-content',
            backgroundColor: 'rgba(246, 248, 250, 1)',
            borderRadius: '0.25rem',
            '& .MuiSvgIcon-root.MuiSvgIcon-root': {
              fontSize: '12px',
            },
            '&:active': { backgroundColor: '#e4e4e4' },
          }}
          endIcon={<UserAddSmallIcon />}
          type="submit"
        >
          {tr.UserManagement.addUser}
        </Button>
      </FormControl>
    </Box>
  );
}
