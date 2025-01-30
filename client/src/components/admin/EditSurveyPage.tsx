import { SurveyPageSidebarImageSize } from '@interfaces/survey';
import ClearIcon from '@src/components/icons/ClearIcon';
import CheckIcon from '@src/components/icons/CheckIcon';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Skeleton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSurvey } from '@src/stores/SurveyContext';
import { useAdminMap } from '@src/stores/SurveyMapContext';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import ConfirmDialog from '../ConfirmDialog';
import Fieldset from '../Fieldset';
import AddSurveySectionActions from './AddSurveySectionActions';
import { AdminSurveyMapPreview } from './AdminSurveyMapPreview';
import { EditSurveyPageConditions } from './EditSurveyPageConditions';
import FileUpload from './FileUpload';
import SurveySections from './SurveySections';

const useStyles = makeStyles({
  button: {
    width: 'fit-content',
  },
});

interface Props {
  canDelete: boolean;
}

export default function EditSurveyPage(props: Props) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number>(null);
  const { defaultView } = useAdminMap();
  const classes = useStyles();
  const { surveyId, pageId } = useParams<{
    surveyId: string;
    pageId: string;
  }>();
  const {
    activeSurvey,
    activeSurveyLoading,
    editPage,
    deletePage,
    addSection,
    availableMapLayers,
    availableMapLayersLoading,
  } = useSurvey();
  const history = useHistory();
  const { tr, surveyLanguage } = useTranslations();
  const { showToast } = useToasts();
  const { setDefaultView } = useAdminMap();
  const [mapPreviewOpen, setMapPreviewOpen] = useState(false);
  const [modifyMapView, setModifyMapView] = useState(false);
  const [isEditable, setIsEditable] = useState<boolean | null>(null);

  const theme = useTheme();

  useEffect(() => {
    const getSubmissions = async () => {
      try {
        const submissions = await (
          await fetch(`/api/surveys/${surveyId}/submissions`)
        ).json();
        if (submissions.length > 0) {
          setIsEditable(false);
        } else {
          setIsEditable(true);
        }
      } catch (error) {
        showToast({
          severity: 'error',
          message: tr.EditSurveyPage.errorCheckingSubmissions,
        });
        setIsEditable(true);
      }
    };
    getSubmissions();
  }, []);

  const page = useMemo(() => {
    return activeSurvey.pages.find((page) => page.id === Number(pageId));
  }, [activeSurvey, pageId]);

  // set page sidebar map default geometry for admin map context if available
  useEffect(() => {
    if (!page?.sidebar?.defaultMapView) return;
    setDefaultView(page.sidebar.defaultMapView);
  }, [page]);

  // If page ID in URL doesn't exist, redirect to survey front page
  useEffect(() => {
    if (activeSurvey && !page) {
      history.push(`/kyselyt/${surveyId}`);
    }
  }, [activeSurvey, page]);

  // If page changes, collapse section accordions
  useEffect(() => {
    setExpandedSection(null);
  }, [page?.id]);

  // Reflect loading status when e.g. the entire survey is being saved
  useEffect(() => {
    setLoading(activeSurveyLoading);
  }, [activeSurveyLoading]);

  function handleDeleteDefaultView() {
    setDefaultView(null);
    editPage({ ...page, sidebar: { ...page.sidebar, defaultMapView: null } });
  }

  if (isEditable === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center',
          alignItems: 'center',
          mt: 4,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: 'primary.main',
            mt: 2,
            '&::after': {
              display: 'inline-block',
              width: '1em',
              textAlign: 'left',
              animation: 'blink 1s steps(1, end) infinite',
              content: '""',
            },
            '@keyframes blink': {
              '0%, 20%': { content: '""' },
              '40%': { content: '"."' },
              '60%': { content: '".."' },
              '80%, 100%': { content: '"..."' },
            },
          }}
        >
          {tr.EditSurveyPage.fetchingSubmissions}
        </Typography>

        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return !page ? null : (
    <Fieldset loading={loading}>
      <TextField
        label={tr.EditSurveyPage.name}
        required
        value={page?.title?.[surveyLanguage] ?? ''}
        onChange={(event) => {
          editPage({
            ...page,
            title: { ...page.title, [surveyLanguage]: event.target.value },
          });
        }}
      />
      {props.canDelete && (
        <Button
          style={{
            display: 'flex',
            position: 'fixed',
            right: '2rem',
            zIndex: 10,
          }}
          disabled={loading}
          color="error"
          variant="contained"
          className={classes.button}
          onClick={() => {
            setDeleteConfirmDialogOpen(true);
          }}
        >
          {tr.EditSurveyPage.deletePage}
        </Button>
      )}

      <EditSurveyPageConditions />
      <FormGroup>
        <FormLabel>{tr.EditSurveyPage.selectSidebarType}</FormLabel>
        <ToggleButtonGroup
          color="primary"
          exclusive
          value={page.sidebar.type}
          onChange={(_, newValue) => {
            editPage({
              ...page,
              sidebar: {
                ...page.sidebar,
                type: newValue,
              },
            });
          }}
        >
          <ToggleButton value="none">
            {tr.EditSurveyPage.sidebarType.none}
          </ToggleButton>
          <ToggleButton value="map">
            {tr.EditSurveyPage.sidebarType.map}
          </ToggleButton>
          <ToggleButton value="image">
            {tr.EditSurveyPage.sidebarType.image}
          </ToggleButton>
        </ToggleButtonGroup>
      </FormGroup>
      {page.sidebar.type === 'map' &&
        (!activeSurvey.mapUrl ? (
          <div>{tr.EditSurveyPage.warningNoMapUrl}</div>
        ) : !availableMapLayers.length ? (
          <div>{tr.EditSurveyPage.warningNoAvailableMapLayers}</div>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <FormLabel>{tr.EditSurveyPage.mapLayers}</FormLabel>
              <FormGroup aria-label="map-layers">
                {availableMapLayersLoading && (
                  <Skeleton variant="rectangular" height={200} width="100%" />
                )}
                {!availableMapLayersLoading &&
                  availableMapLayers.map((layer) => (
                    <FormControlLabel
                      sx={{ maxWidth: '500px' }}
                      key={layer.id}
                      label={layer.name}
                      control={
                        <Checkbox
                          checked={page.sidebar.mapLayers?.includes(layer.id)}
                          onChange={(event) => {
                            const mapLayers = event.target.checked
                              ? // When adding a new layer, re-sort the array to ensure that
                                // changes are detected correctly (the order won't matter anyway)
                                [...page.sidebar.mapLayers, layer.id].sort()
                              : page.sidebar.mapLayers.filter(
                                  (layerId) => layerId !== layer.id,
                                );
                            editPage({
                              ...page,
                              sidebar: {
                                ...page.sidebar,
                                mapLayers,
                              },
                            });
                          }}
                          name={layer.name}
                        />
                      }
                    />
                  ))}
              </FormGroup>
            </div>
            <Box
              sx={{
                minWidth: '270px',
                '& .MuiButtonBase-root': { padding: '4px 10px' },
              }}
            >
              <FormLabel htmlFor="mapview-button-container">
                {tr.EditSurveyPage.defaultMapView}
              </FormLabel>
              <Box
                pt={1.5}
                display="flex"
                gap={1}
                id="default-map-status-container"
              >
                {page.sidebar.defaultMapView ? (
                  <>
                    <CheckIcon color="success" />
                    <Typography>
                      {tr.EditSurveyPage.defaultMapViewStatus.set}
                    </Typography>
                  </>
                ) : (
                  <>
                    <ClearIcon sx={{ color: '#0000008A' }} />
                    <Typography>
                      {tr.EditSurveyPage.defaultMapViewStatus.notSet}
                    </Typography>
                  </>
                )}
              </Box>
              {page.sidebar.defaultMapView ? (
                <Box
                  id="mapview-button-container"
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    marginTop: '12px',
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={() => setMapPreviewOpen(true)}
                  >
                    {tr.EditSurveyPage.mapViewButtons.showMap}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setModifyMapView(true);
                      setMapPreviewOpen(true);
                    }}
                  >
                    {tr.EditSurveyPage.mapViewButtons.modifyDefaultView}
                  </Button>

                  <Button
                    sx={{ marginLeft: 'auto' }}
                    color="error"
                    onClick={() => handleDeleteDefaultView()}
                  >
                    {tr.EditSurveyPage.mapViewButtons.deleteDefaultView}
                  </Button>
                </Box>
              ) : (
                <Button
                  sx={{ marginTop: '12px' }}
                  variant="contained"
                  onClick={() => {
                    setModifyMapView(true);
                    setMapPreviewOpen(true);
                  }}
                >
                  {tr.EditSurveyPage.mapViewButtons.set}
                </Button>
              )}
            </Box>
          </Box>
        ))}
      {page.sidebar.type === 'image' && (
        <div>
          <FileUpload
            surveyId={activeSurvey.id}
            targetPath={[String(activeSurvey.id)]}
            surveyOrganizationId={activeSurvey.organization.id}
            value={
              !page.sidebar.imageUrl
                ? null
                : [
                    {
                      url: page.sidebar.imageUrl,
                    },
                  ]
            }
            onUpload={({ url }) => {
              editPage({
                ...page,
                sidebar: {
                  ...page.sidebar,
                  imageUrl: url,
                  imageSize: 'fitted',
                },
              });
            }}
            onDelete={() => {
              editPage({
                ...page,
                sidebar: {
                  ...page.sidebar,
                  imageUrl: null,
                  imageSize: null,
                },
              });
            }}
          />
          <TextField
            style={{ width: '100%', marginTop: 2 }}
            label={tr.EditSurveyPage.imageAltText}
            value={page.sidebar?.imageAltText?.[surveyLanguage] ?? ''}
            onChange={(event) => {
              editPage({
                ...page,
                sidebar: {
                  ...page.sidebar,
                  imageAltText: {
                    ...page.sidebar.imageAltText,
                    [surveyLanguage]: event.target.value,
                  },
                },
              });
            }}
          />
          <FormControl sx={{ marginTop: 2 }}>
            <FormLabel>{tr.EditSurveyPage.imageScaling}</FormLabel>
            <RadioGroup
              row
              onChange={(event) =>
                editPage({
                  ...page,
                  sidebar: {
                    ...page.sidebar,
                    imageSize: event.target.value as SurveyPageSidebarImageSize,
                  },
                })
              }
            >
              <FormControlLabel
                sx={{ marginRight: 4 }}
                checked={page.sidebar?.imageSize === 'fitted'}
                value="fitted"
                control={<Radio />}
                label={tr.EditSurveyPage.imageScalingLabel.fitted}
              />
              <FormControlLabel
                checked={page.sidebar?.imageSize === 'original'}
                value="original"
                control={<Radio />}
                label={tr.EditSurveyPage.imageScalingLabel.original}
              />
            </RadioGroup>
          </FormControl>
        </div>
      )}
      <SurveySections
        page={page}
        disabled={loading}
        expandedSection={expandedSection}
        onExpandedSectionChange={(section) => {
          setExpandedSection(section);
        }}
      />
      <AddSurveySectionActions
        disabled={loading}
        onAdd={(newSection) => {
          addSection(page.id, newSection);
          // Open last section after adding a new one
          setExpandedSection(page.sections.length);
        }}
      />
      <ConfirmDialog
        open={deleteConfirmDialogOpen}
        text={tr.EditSurveyPage.confirmDeletePage}
        submitColor="error"
        onClose={async (result) => {
          setDeleteConfirmDialogOpen(false);
          if (result) {
            setLoading(true);
            try {
              await deletePage(activeSurvey.id, page.id);
            } catch (error) {
              showToast({
                severity: 'error',
                message: tr.EditSurveyPage.deletePageFailed,
              });
              setLoading(false);
              throw error;
            }
          }
        }}
      />
      <AdminSurveyMapPreview
        url={activeSurvey.mapUrl}
        isOpen={mapPreviewOpen}
        setIsOpen={setMapPreviewOpen}
        modifyView={modifyMapView}
        setModifyView={setModifyMapView}
        page={page}
        handleSave={() =>
          editPage({
            ...page,
            sidebar: {
              ...page.sidebar,
              defaultMapView: defaultView,
            },
          })
        }
      />

      <Dialog
        open={!isEditable}
        onClose={() => setDeleteConfirmDialogOpen(false)}
      >
        <DialogTitle color={theme.palette.error.dark}>
          {tr.EditSurveyPage.confirmEditDialog.title}
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '500px',
          }}
        >
          <DialogContentText>
            {tr.EditSurveyPage.confirmEditDialog.content}
          </DialogContentText>
          <DialogContentText>
            {tr.EditSurveyPage.confirmEditDialog.confirm}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => history.push(`kyselyt/${surveyId}/perustiedot`)}
            color="primary"
          >
            {tr.commands.cancel}
          </Button>
          <Button
            onClick={() => {
              setIsEditable(true);
            }}
            color="primary"
          >
            {tr.options.yes}
          </Button>
        </DialogActions>
      </Dialog>
    </Fieldset>
  );
}
