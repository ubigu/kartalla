import { MapPublication } from '@interfaces/mapPublications';
import { MapLayer } from '@interfaces/survey';
import { Cancel, Delete, Save, Warning } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  addMapPublication,
  deleteMapPublication,
  getMapPublications,
} from '@src/controllers/MapPublicationsController';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import { useDebounce } from '@src/utils/useDebounce';
import { useEffect, useState } from 'react';
import { AdminAppBar } from './AdminAppBar';

interface NewPublication {
  tempId: string;
  name: string;
  url: string;
}

interface NewPublicationRowProps {
  publication: NewPublication;
  saving: boolean;
  onNameChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  duplicateUrl: boolean;
}

function NewPublicationRow({
  publication,
  saving,
  onNameChange,
  onUrlChange,
  onSave,
  onCancel,
  duplicateUrl,
}: NewPublicationRowProps) {
  const { tr } = useTranslations();
  const [checkingLayers, setCheckingLayers] = useState(false);
  const [layersAvailable, setLayersAvailable] = useState<boolean | undefined>(
    undefined,
  );
  const debouncedUrl = useDebounce(publication.url, 800);

  useEffect(() => {
    async function checkLayers() {
      if (!debouncedUrl.trim()) {
        setLayersAvailable(undefined);
        return;
      }

      setCheckingLayers(true);
      setLayersAvailable(undefined);

      try {
        const layers = await request<MapLayer[]>(
          `/api/map/available-layers?url=${encodeURIComponent(debouncedUrl)}`,
        );
        setLayersAvailable(layers.length > 0);
      } catch (error) {
        setLayersAvailable(false);
      } finally {
        setCheckingLayers(false);
      }
    }

    checkLayers();
  }, [debouncedUrl]);

  return (
    <TableRow key={publication.tempId}>
      <TableCell>
        <TextField
          variant="standard"
          autoComplete="off"
          data-1p-ignore
          fullWidth
          placeholder={tr.AdminMapPublications.publicationName}
          value={publication.name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <TextField
          variant="standard"
          autoComplete="off"
          data-1p-ignore
          fullWidth
          placeholder="https://..."
          value={publication.url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </TableCell>
      <TableCell>
        {checkingLayers ? (
          <CircularProgress size={24} />
        ) : layersAvailable === false ? (
          <Tooltip title={tr.AdminMapPublications.noLayersAvailable}>
            <Warning color="error" />
          </Tooltip>
        ) : duplicateUrl ? (
          <Tooltip title={tr.AdminMapPublications.duplicateUrl}>
            <Warning color="warning" />
          </Tooltip>
        ) : (
          <Box display={'flex'} gap={1}>
            <Tooltip title={tr.commands.save}>
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={
                    saving ||
                    !publication.name.trim() ||
                    !publication.url.trim()
                  }
                  onClick={onSave}
                >
                  <Save />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={tr.commands.cancel}>
              <IconButton size="small" disabled={saving} onClick={onCancel}>
                <Cancel />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}

const styles = {
  content: {
    flexGrow: 1,
    p: 3,
    width: '100%',
    maxWidth: '1500px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  table: {
    '& th, & td': {
      fontSize: '1rem',
      paddingY: '0.5rem',
      '& button': {
        padding: 0,
      },
    },
    '& tr:nth-of-type(even)': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    marginBottom: '2rem',
  },
  addButton: {
    marginLeft: 'auto',
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center',
    color: 'text.secondary',
  },
};

export function AdminMapPublications() {
  const { tr } = useTranslations();
  const { showToast } = useToasts();

  const [publications, setPublications] = useState<MapPublication[]>([]);
  const [newPublications, setNewPublications] = useState<NewPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchPublications() {
      try {
        const data = await getMapPublications();
        setPublications(data);
      } catch (error) {
        showToast({
          severity: 'error',
          message: tr.AdminMapPublications.fetchFailed,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchPublications();
  }, []);

  const handleAddNewRow = () => {
    const tempId = `temp-${Date.now()}`;
    setNewPublications([...newPublications, { tempId, name: '', url: '' }]);
  };

  const handleNewPublicationChange = (
    tempId: string,
    field: 'name' | 'url',
    value: string,
  ) => {
    setNewPublications(
      newPublications.map((pub) =>
        pub.tempId === tempId ? { ...pub, [field]: value } : pub,
      ),
    );
  };

  const handleSaveNewPublication = async (tempId: string) => {
    const newPub = newPublications.find((p) => p.tempId === tempId);
    if (!newPub) return;

    if (!newPub.name.trim() || !newPub.url.trim()) {
      showToast({
        severity: 'error',
        message: tr.AdminMapPublications.nameAndUrlRequired,
      });
      return;
    }

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.add(tempId);
      return next;
    });
    try {
      const result = await addMapPublication({
        name: newPub.name,
        url: newPub.url,
      });

      // Add to publications list
      setPublications([
        ...publications,
        { id: result.id, name: newPub.name, url: newPub.url },
      ]);

      // Remove from new publications
      setNewPublications(newPublications.filter((p) => p.tempId !== tempId));

      showToast({
        severity: 'success',
        message: tr.AdminMapPublications.createSuccess,
      });
    } catch (error) {
      showToast({
        severity: 'error',
        message: tr.AdminMapPublications.createFailed,
      });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const handleCancelNewPublication = (tempId: string) => {
    setNewPublications(newPublications.filter((p) => p.tempId !== tempId));
  };

  const handleDeletePublication = async (id: string) => {
    if (!confirm(tr.AdminMapPublications.deleteConfirm)) {
      return;
    }

    try {
      await deleteMapPublication(id);
      setPublications(publications.filter((p) => p.id !== id));
      showToast({
        severity: 'success',
        message: tr.AdminMapPublications.deleteSuccess,
      });
    } catch (error) {
      showToast({
        severity: 'error',
        message: tr.AdminMapPublications.deleteFailed,
      });
    }
  };

  return (
    <>
      <AdminAppBar labels={[tr.AppBar.mapPublications]} />
      <Stack component="main" sx={styles.content}>
        <Toolbar />

        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={300} />
        ) : (
          <>
            <TableContainer sx={styles.table}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '30%' }}>
                      {tr.AdminMapPublications.name}
                    </TableCell>
                    <TableCell sx={{ width: '60%' }}>
                      {tr.AdminMapPublications.url}
                    </TableCell>
                    <TableCell component={'td'} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {publications.length === 0 &&
                    newPublications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Box sx={styles.emptyState}>
                            <Typography variant="body2">
                              {tr.AdminMapPublications.emptyState}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}

                  {publications.map((pub) => (
                    <TableRow key={pub.id}>
                      <TableCell>{pub.name}</TableCell>
                      <TableCell>{pub.url}</TableCell>
                      <TableCell>
                        <Tooltip title={tr.commands.remove}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePublication(pub.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {newPublications.map((newPub) => (
                    <NewPublicationRow
                      key={newPub.tempId}
                      publication={newPub}
                      saving={savingIds.has(newPub.tempId)}
                      onNameChange={(value) =>
                        handleNewPublicationChange(newPub.tempId, 'name', value)
                      }
                      onUrlChange={(value) =>
                        handleNewPublicationChange(newPub.tempId, 'url', value)
                      }
                      onSave={() => handleSaveNewPublication(newPub.tempId)}
                      onCancel={() => handleCancelNewPublication(newPub.tempId)}
                      duplicateUrl={
                        publications.findIndex(
                          (pub) => pub.url.trim() === newPub.url.trim(),
                        ) !== -1
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              variant="contained"
              onClick={handleAddNewRow}
              sx={styles.addButton}
            >
              {tr.AdminMapPublications.addNew}
            </Button>
          </>
        )}
      </Stack>
    </>
  );
}
