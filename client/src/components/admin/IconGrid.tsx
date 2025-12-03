import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';

type IconWithSvg = { id: number | string; svgContent?: string; svg?: string };

interface IconGridProps {
  icons: IconWithSvg[];
  loading: boolean;
  emptyMessage: string;
  showDeleteButton: boolean;
  onSelect: (svgContent: string) => void;
  onDeleteRequest: (iconId: number | string) => void;
}

export function IconGrid({
  icons,
  loading,
  emptyMessage,
  showDeleteButton,
  onSelect,
  onDeleteRequest,
}: IconGridProps) {
  const { tr } = useTranslations();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (icons.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
        {emptyMessage}
      </Box>
    );
  }

  return (
    <Grid container spacing={1}>
      {icons.map((icon) => {
        const svgContent = icon.svgContent || icon.svg || '';
        return (
          <Grid item xs={3} key={icon.id}>
            <Box
              sx={{
                position: 'relative',
                display: 'inline-block',
                width: '100%',
                '&:hover [data-delete-btn]': {
                  opacity: 1,
                },
              }}
            >
              <button
                onClick={() => onSelect(svgContent)}
                style={{
                  position: 'relative',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  background: 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'block',
                }}
              >
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`}
                  alt=""
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 50,
                    display: 'block',
                  }}
                />
              </button>
              {showDeleteButton && (
                <Tooltip title={tr.SvgIconSelect.delete}>
                  <IconButton
                    data-delete-btn
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(icon.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover, &:focus, &:focus-visible': {
                        opacity: 1,
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}
