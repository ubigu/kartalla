import { CredentialsEntry } from '@interfaces/submission';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  Link,
  TextField,
  Theme,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import HierarchyIcon from '@src/components/icons/HierarchyIcon';
import LinkSmallIcon from '@src/components/icons/LinkSmallIcon';
import { Toast, useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import React, { useEffect, useState } from 'react';

interface Props {
  surveyId: number;
}

const CredentialsInputLabel = styled(InputLabel)(
  ({ theme }: { theme: Theme }) => ({
    color: theme.palette.primary.main,
  }),
);
const CredentialsInput = styled(TextField)(({ theme }: { theme: Theme }) => ({
  'label + &': {
    marginTop: theme.spacing(2),
  },
  '& .MuiInputBase-input': {
    backgroundColor: '#F0F0F0',
    padding: '10px 12px',
  },
}));
const ApiLink = styled(Link)(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '16px',
}));
const ApiLinkIcon = styled(LinkSmallIcon)(() => ({
  width: '15px',
  marginRight: '8px',
}));

const initialInput = {
  username: '',
  password: '',
  passwordAgain: '',
  alphanumericIncluded: true,
  geospatialIncluded: true,
  personalIncluded: false,
};

export default function DataPublish({ surveyId }: Props) {
  const [displayDialog, setDisplayDialog] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [input, setInput] = useState(initialInput);
  const [passwordsMismatch, setPasswordsMismatch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const publicationURL = `${window.location.protocol}//${
    window.location.hostname
  }${
    window.location.port ? `:${window.location.port}` : ''
  }/api/surveys/${surveyId}/publication`;

  useEffect(() => {
    const mismatchCheck =
      input.passwordAgain.length > 0 && input.password !== input.passwordAgain;

    if (passwordsMismatch === mismatchCheck) return;

    setPasswordsMismatch(mismatchCheck);
  }, [input.password, input.passwordAgain]);

  useEffect(() => {
    async function fetchCredentials() {
      try {
        setIsLoading(true);
        const credentialsArr = await request<CredentialsEntry[]>(
          `/api/surveys/${surveyId}/publication/credentials`,
        );
        if (credentialsArr.length > 0) {
          setCredentials(credentialsArr[0]);
        }
      } catch (err) {
        showToast(getErrorObject(err));
      } finally {
        setIsLoading(false);
      }
    }
    fetchCredentials();
  }, []);

  function getErrorObject(err: Response | Error): Toast {
    return {
      severity: 'error',
      message: err instanceof Error ? err.message : err.statusText,
    };
  }

  function handleInputChange({
    target,
  }: {
    target: HTMLInputElement | HTMLTextAreaElement;
  }) {
    setInput({
      ...input,
      [target.name]:
        target.type === 'checkbox'
          ? (target as HTMLInputElement).checked
          : target.value,
    });
  }

  function initDialog() {
    setInput(
      credentials
        ? {
            username: credentials.username,
            password: initialInput.password,
            passwordAgain: initialInput.passwordAgain,
            alphanumericIncluded: credentials.alphanumericIncluded,
            geospatialIncluded: credentials.geospatialIncluded,
            personalIncluded: credentials.personalIncluded,
          }
        : initialInput,
    );
    setDisplayDialog((prev: boolean) => !prev);
  }

  async function upsertCredentials() {
    const isUpdate = credentials !== null;
    try {
      setIsLoading(true);
      setCredentials(
        await request<CredentialsEntry>(
          `/api/surveys/${surveyId}/publication/credentials`,
          {
            method: 'PUT',
            body: input,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      showToast({
        severity: 'success',
        message: isUpdate
          ? tr.DataPublish.updateApiSuccessful
          : tr.DataPublish.openApiSuccessful,
      });
      setDisplayDialog(false);
    } catch (err) {
      showToast(getErrorObject(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteCredentials() {
    try {
      setIsLoading(true);
      await request<CredentialsEntry>(
        `/api/surveys/${surveyId}/publication/credentials`,
        {
          method: 'DELETE',
        },
      );
      setCredentials(null);
      showToast({
        severity: 'success',
        message: tr.DataPublish.closeApiSuccessful,
      });
      setDisplayDialog(false);
    } catch (err) {
      showToast(getErrorObject(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Button
          startIcon={<HierarchyIcon />}
          sx={{ marginRight: 'auto' }}
          variant="outlined"
          onClick={initDialog}
        >
          {credentials
            ? tr.DataPublish.submissionsApi
            : tr.DataPublish.openSubmissionsApi}
        </Button>
      )}
      <Dialog
        open={displayDialog}
        onClose={() => setDisplayDialog(false)}
        sx={{ '& .MuiDialog-paper': { width: '670px', maxWidth: '900px' } }}
      >
        <DialogTitle>
          {credentials
            ? tr.DataPublish.submissionsApiOptions
            : tr.DataPublish.submissionsApiOpening}
        </DialogTitle>
        {isLoading && (
          <DialogContent
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 0,
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: 1,
              background: 'inherit',
            }}
          >
            <CircularProgress size={50} />
          </DialogContent>
        )}
        <DialogContent>
          <Grid container spacing={10}>
            <Grid item xs={6}>
              <Typography component="h3">
                {tr.DataPublish.credentials}
              </Typography>
              <Box
                component="form"
                sx={{
                  mt: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <FormControl variant="standard">
                  <CredentialsInputLabel shrink htmlFor="credentials-username">
                    {tr.DataPublish.username}
                  </CredentialsInputLabel>
                  <CredentialsInput
                    required
                    id="credentials-username"
                    name="username"
                    value={input.username}
                    onChange={handleInputChange}
                    autoComplete="username"
                  />
                </FormControl>
                <FormControl variant="standard">
                  <CredentialsInputLabel shrink htmlFor="credentials-password">
                    {tr.DataPublish.password}
                  </CredentialsInputLabel>
                  <CredentialsInput
                    required
                    id="credentials-password"
                    name="password"
                    type="password"
                    value={input.password}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    error={passwordsMismatch}
                  />
                </FormControl>
                <FormControl variant="standard">
                  <CredentialsInputLabel
                    shrink
                    htmlFor="credentials-passwordAgain"
                  >
                    {tr.DataPublish.passwordAgain}
                  </CredentialsInputLabel>
                  <CredentialsInput
                    required
                    id="credentials-passwordAgain"
                    name="passwordAgain"
                    type="password"
                    value={input.passwordAgain}
                    onChange={handleInputChange}
                    error={passwordsMismatch}
                    autoComplete="new-password"
                    helperText={
                      passwordsMismatch && tr.DataPublish.passwordsMismatch
                    }
                  />
                </FormControl>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography component="h3">
                {tr.DataPublish.materialsOffered}
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box display="flex" flexDirection="column">
                  <FormControlLabel
                    label={tr.DataPublish.alphanumericSubmissions}
                    control={
                      <Checkbox
                        name="alphanumericIncluded"
                        checked={input.alphanumericIncluded}
                        onChange={handleInputChange}
                      />
                    }
                  />
                  {input.alphanumericIncluded && (
                    <FormControlLabel
                      sx={{
                        marginLeft: '8px',
                        height: '26px',
                        '& .MuiFormControlLabel-label': {
                          fontSize: '14px',
                        },
                        paddingBottom: '6px',
                      }}
                      label={tr.DataPublish.personalInfo}
                      control={
                        <Checkbox
                          name="personalIncluded"
                          checked={input.personalIncluded}
                          onChange={handleInputChange}
                        />
                      }
                    />
                  )}
                </Box>
                <FormControlLabel
                  label={tr.DataPublish.geospatialSubmissions}
                  control={
                    <Checkbox
                      name="geospatialIncluded"
                      checked={input.geospatialIncluded}
                      onChange={handleInputChange}
                    />
                  }
                />
              </Box>
            </Grid>
          </Grid>
          <ApiLink href={publicationURL} target="_blank" underline="none">
            <ApiLinkIcon />
            {publicationURL}
          </ApiLink>
          {input.geospatialIncluded && (
            <ApiLink
              href={`${publicationURL}/geojson`}
              target="_blank"
              underline="none"
            >
              <ApiLinkIcon />
              {`${publicationURL}/geojson`}
            </ApiLink>
          )}
        </DialogContent>
        <DialogActions>
          {credentials && (
            <Button
              color="warning"
              onClick={deleteCredentials}
              sx={{
                textAlign: 'left',
              }}
            >
              {tr.DataPublish.closeApi}
            </Button>
          )}
          <Box component="div" sx={{ flex: '1 0 0' }} />
          <Button onClick={() => setDisplayDialog(false)}>
            {tr.commands.cancel}
          </Button>
          <Button
            onClick={upsertCredentials}
            disabled={
              input.username.length === 0 ||
              input.password.length === 0 ||
              input.passwordAgain.length === 0 ||
              passwordsMismatch
            }
          >
            {credentials ? tr.commands.save : tr.DataPublish.openApi}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
