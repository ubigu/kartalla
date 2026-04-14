// @ts-strict-ignore
import { User } from '@interfaces/user';
import { UserGroup } from '@interfaces/userGroup';
import { Autocomplete, Chip, TextField, Typography } from '@mui/material';
import { getUserGroups } from '@src/controllers/UserGroupController';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useState } from 'react';
import { useUser } from '../../stores/UserContext';
import Fieldset from '../Fieldset';

interface Props {
  canEdit: boolean;
}

export default function EditSurveyPermissions(props: Props) {
  const [availableUserGroups, setAvailableUserGroups] = useState<UserGroup[]>(
    [],
  );

  const { activeSurvey, activeSurveyLoading, editSurvey } = useSurvey();
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const { allUsers, activeUser, activeUserIsAdmin, activeUserIsSuperUser } =
    useUser();

  useEffect(() => {
    async function refreshUserGroups() {
      try {
        const userGroups = await getUserGroups();
        setAvailableUserGroups(userGroups);
      } catch (error) {
        showToast({
          severity: 'error',
          message: tr.EditSurveyInfo.userGroupFetchFailed,
        });
      }
    }
    refreshUserGroups();
  }, []);

  function surveyUserGroupEditingDisabled() {
    if (activeUserIsAdmin || activeUserIsSuperUser) {
      return false;
    }

    if (!activeUser || activeSurvey.authorId !== activeUser.id) {
      return true;
    }

    return (
      !props.canEdit ||
      (activeUser.groups?.length === 1 && activeSurvey.userGroups?.length > 0)
    );
  }

  return (
    <Fieldset loading={activeSurveyLoading}>
      <Typography variant="h4" component={'h1'}>
        {tr.EditSurvey.permissions}
      </Typography>
      <Autocomplete
        multiple
        filterSelectedOptions
        disabled={surveyUserGroupEditingDisabled()}
        options={availableUserGroups}
        getOptionLabel={(group) => group.name}
        value={
          availableUserGroups.filter((group) =>
            activeSurvey.userGroups?.includes(group.id),
          ) ?? []
        }
        onChange={(_, value) => {
          editSurvey({
            ...activeSurvey,
            userGroups: value.map((group) => group.id),
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={tr.EditSurveyInfo.userGroups}
            helperText={tr.EditSurveyInfo.userGroupsHelperText}
          />
        )}
        renderTags={(value, getTagProps) => {
          return value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return <Chip key={key} label={option.name} {...tagProps} />;
          });
        }}
      />
      <Autocomplete
        multiple
        filterSelectedOptions
        disabled={allUsers == null || !props.canEdit}
        options={
          allUsers?.filter(
            (user) =>
              user.id !== activeSurvey.authorId && user.id !== activeUser.id,
          ) ?? []
        }
        getOptionLabel={(user) => user.fullName}
        value={
          allUsers?.filter((user) => activeSurvey.editors?.includes(user.id)) ??
          []
        }
        onChange={(_, value: User[]) => {
          editSurvey({
            ...activeSurvey,
            editors: value.map((user) => user.id),
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={tr.EditSurveyInfo.editors}
            helperText={tr.EditSurveyInfo.editorsHelperText}
          />
        )}
        renderTags={(value: User[], getTagProps) => {
          return value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option.fullName}
                {...tagProps}
                disabled={option.id === activeUser.id}
              />
            );
          });
        }}
      />
      <Autocomplete
        multiple
        filterSelectedOptions
        disabled={allUsers == null || !props.canEdit}
        options={
          allUsers?.filter(
            (user) =>
              user.id !== activeSurvey.authorId && user.id !== activeUser.id,
          ) ?? []
        }
        getOptionLabel={(user) => user.fullName}
        value={
          allUsers?.filter((user) => activeSurvey.viewers?.includes(user.id)) ??
          []
        }
        onChange={(_, value: User[]) => {
          editSurvey({
            ...activeSurvey,
            viewers: value.map((user) => user.id),
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={tr.EditSurveyInfo.viewers}
            helperText={tr.EditSurveyInfo.viewersHelperText}
          />
        )}
        renderTags={(value: User[], getTagProps) => {
          return value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option.fullName}
                {...tagProps}
                disabled={option.id === activeUser.id}
              />
            );
          });
        }}
      />
    </Fieldset>
  );
}
