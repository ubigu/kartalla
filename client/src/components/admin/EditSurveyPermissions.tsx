import { UserGroup } from '@interfaces/userGroup';
import { Box, Typography } from '@mui/material';
import { getUserGroups } from '@src/controllers/UserGroupController';
import { useSurvey } from '@src/stores/SurveyContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useState } from 'react';
import { useUser } from '../../stores/UserContext';
import { Combobox_WIP } from '../core/Combobox';
import { loadingPulse } from '../core/styles';

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
      (activeUser.groups?.length === 1 &&
        activeSurvey.userGroups &&
        activeSurvey.userGroups.length > 0)
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '36px',
        maxWidth: 'min(55em, 70%)',
        ...(activeSurveyLoading && loadingPulse),
      }}
    >
      <Typography variant="mainHeader" component={'h1'}>
        {tr.EditSurvey.permissions}
      </Typography>

      <Combobox_WIP
        label={tr.EditSurveyInfo.userGroups}
        helperText={tr.EditSurveyInfo.userGroupsHelperText}
        options={availableUserGroups.map((group) => ({
          value: group.id,
          label: group.name,
        }))}
        multiselect
        disabled={surveyUserGroupEditingDisabled()}
        value={activeSurvey.userGroups}
        onMultiChange={(value) => {
          editSurvey({
            ...activeSurvey,
            userGroups: value.map((val) => String(val)),
          });
        }}
      />

      <Combobox_WIP
        label={tr.EditSurveyInfo.editors}
        helperText={tr.EditSurveyInfo.editorsHelperText}
        options={(
          allUsers?.filter(
            (user) =>
              user.id !== activeSurvey.authorId && user.id !== activeUser?.id,
          ) ?? []
        ).map((user) => ({ value: user.id, label: user.fullName }))}
        multiselect
        disabled={allUsers == null || !props.canEdit}
        value={activeSurvey.editors ?? []}
        onMultiChange={(value) => {
          editSurvey({
            ...activeSurvey,
            editors: value.map(String),
          });
        }}
      />
      <Combobox_WIP
        label={tr.EditSurveyInfo.viewers}
        helperText={tr.EditSurveyInfo.viewersHelperText}
        options={(
          allUsers?.filter(
            (user) =>
              user.id !== activeSurvey.authorId && user.id !== activeUser?.id,
          ) ?? []
        ).map((user) => ({ value: user.id, label: user.fullName }))}
        multiselect
        disabled={allUsers == null || !props.canEdit}
        value={activeSurvey.viewers ?? []}
        onMultiChange={(value) => {
          editSurvey({
            ...activeSurvey,
            viewers: value.map(String),
          });
        }}
      />
    </Box>
  );
}
