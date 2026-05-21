// @ts-strict-ignore
import { Box, Button, FormControl } from '@mui/material';
import { Input } from '@src/components/core/Input';
import { Select } from '@src/components/core/Select';
import UserAddSmallIcon from '@src/components/icons/UserAddSmallIcon';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useState } from 'react';

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
      }}
    >
      <FormControl
        onSubmit={async (e) => {
          const currentTarget = e.currentTarget as UsernameFormElement;
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
          <Input
            label={tr.UserManagement.name}
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
          <Input
            label={tr.UserManagement.email}
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
          <Select
            required
            label={tr.UserManagement.role}
            id="userRightsSelect"
            onChange={(val) => setSelectedRole(val)}
            value={selectedRole}
            options={[
              {
                label: tr.UserManagement.regularUser,
                value: 'organization_user',
              },
              { label: tr.UserManagement.admin, value: 'organization_admin' },
            ]}
          />
        </FormControl>
        <Button variant="outlined" endIcon={<UserAddSmallIcon />} type="submit">
          {tr.UserManagement.addUser}
        </Button>
      </FormControl>
    </Box>
  );
}
