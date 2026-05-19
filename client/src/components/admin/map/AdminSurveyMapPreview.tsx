import { Backdrop, Box, Button, Typography } from '@mui/material';

import { SurveyMapProvider, SurveyPage } from '@interfaces/survey';
import { useAdminMap } from '@src/stores/SurveyMapContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { Dispatch, SetStateAction } from 'react';
import { OlAdminMap } from './OlAdminMap';
import { OskariAdminMap } from './OskariAdminMap';

interface Props {
  isOpen: boolean;
  url: string;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  handleSave: () => void;
  page: SurveyPage;
  modifyView: boolean;
  setModifyView: Dispatch<SetStateAction<boolean>>;
  provider: SurveyMapProvider;
}

export function AdminSurveyMapPreview({
  isOpen,
  setIsOpen,
  url,
  handleSave,
  page,
  modifyView,
  setModifyView,
  provider,
}: Props) {
  const { tr } = useTranslations();
  const { clearDefaultView } = useAdminMap();

  const previewMap = {
    oskari: <OskariAdminMap allowDrawing={modifyView} url={url} page={page} />,
    openlayers: <OlAdminMap allowDrawing={modifyView} page={page} />,
  };

  return (
    <Backdrop
      open={isOpen}
      sx={{
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        className="map-container"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: '10px',
          backgroundColor: 'white',
          width: '70%',
          height: '70vh',
          borderRadius: 2,
        }}
      >
        {modifyView && (
          <Box
            sx={{
              backgroundColor: 'white',
              margin: '0 auto',
              padding: '0.15rem 0',
              textAlign: 'center',
            }}
            className="map-preview-header"
          >
            <Typography>{tr.EditSurveyPage.defaultMapViewInfo}</Typography>
          </Box>
        )}

        <Box sx={{ flex: 1, margin: '0.5rem -10px' }}>
          {isOpen && previewMap[provider]}
        </Box>

        <Box
          sx={{
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            '& .MuiButtonBase-root': { padding: '4px 10px' },
          }}
          className="map-preview-footer"
        >
          {modifyView ? (
            <>
              <Button
                onClick={() => clearDefaultView()}
                color="error"
                sx={{ marginRight: 'auto' }}
              >
                {tr.EditSurveyPage.mapViewButtons.clear}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setModifyView(false);
                  setIsOpen(false);
                }}
              >
                {tr.EditSurveyPage.mapViewButtons.cancel}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleSave();
                  setModifyView(false);
                  setIsOpen(false);
                }}
              >
                {tr.EditSurveyPage.mapViewButtons.set}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setIsOpen(false)}>
              {tr.EditSurveyPage.mapViewButtons.close}
            </Button>
          )}
        </Box>
      </Box>
    </Backdrop>
  );
}
