import { SvgIcon } from '@interfaces/survey';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Tab,
  Tabs,
  Tooltip,
} from '@mui/material';
import { EmojiPicker } from '@src/components/admin/EmojiPicker';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import {
  deleteSvgIcon,
  getSvgIcons,
  uploadSvgIcon,
} from '@src/utils/svgIconAPI';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value?: string;
  onChange?: (value: string | null) => void;
}

export function emojiToSvg(emoji: string, size: number) {
  // These dimensions are eyeballed to look good both in React UI and Oskari map
  const fontSize = size;
  const padding = 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-padding} ${-padding} ${size + padding} ${size + padding}" width="${size}" height="${size}"><text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}">${emoji}</text></svg>`;
}

export function SvgIconSelect(props: Props) {
  const { tr } = useTranslations();
  const { showToast } = useToasts();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(props.value);
  const [tabValue, setTabValue] = useState<'emoji' | 'custom'>('emoji');
  const [customIcons, setCustomIcons] = useState<SvgIcon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    iconId?: number;
  }>({ open: false });
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(value);
  }, [props.value]);

  useEffect(() => {
    props.onChange?.(value);
  }, [value]);

  useEffect(() => {
    if (isOpen && tabValue === 'custom') {
      loadCustomIcons();
    }
  }, [isOpen, tabValue]);

  async function loadCustomIcons() {
    try {
      setIsLoading(true);
      const icons = await getSvgIcons();
      setCustomIcons(icons);
    } catch (error) {
      showToast({
        severity: 'error',
        message: 'Failed to load custom SVG icons',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    try {
      setIsUploading(true);
      const newIcon = await uploadSvgIcon(file, file.name);
      setCustomIcons([newIcon, ...customIcons]);
      showToast({
        severity: 'success',
        message: tr.SvgIconSelect.uploadSuccess,
      });
    } catch (error) {
      showToast({
        severity: 'error',
        message: tr.SvgIconSelect.uploadError,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(iconId: number) {
    try {
      await deleteSvgIcon(iconId);
      setCustomIcons(customIcons.filter((icon) => icon.id !== iconId));
      setDeleteConfirmDialog({ open: false });
      showToast({
        severity: 'success',
        message: tr.SvgIconSelect.deleteSuccess,
      });
    } catch (error) {
      showToast({
        severity: 'error',
        message: tr.SvgIconSelect.deleteError,
      });
    }
  }

  return (
    <>
      <FormControl style={{ minWidth: '7rem' }}>
        <InputLabel id="svg-icon-select-label">
          {tr.MarkerIconSelect.icon}
        </InputLabel>
        <Select
          ref={inputRef}
          // Never actually open the select - we're just using it for displaying the selected value and opening the popover
          open={false}
          value={value ? 'true' : ''}
          renderValue={() => (
            <img
              style={{ height: '1.5rem' }}
              src={`data:image/svg+xml;utf8,${encodeURIComponent(value)}`}
            />
          )}
          onClick={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <MenuItem value="true" sx={{ display: 'none' }} />
          <MenuItem value="" sx={{ display: 'none' }} />
        </Select>
      </FormControl>

      <Popover
        open={isOpen}
        anchorEl={inputRef.current}
        onClose={() => setIsOpen(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', width: 280 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
            >
              <Tab label={tr.SvgIconSelect.emoji} value="emoji" />
              <Tab label={tr.SvgIconSelect.customSvgs} value="custom" />
            </Tabs>
          </Box>
          {tabValue === 'emoji' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <EmojiPicker
                onSelect={(selectedEmoji) => {
                  setValue(emojiToSvg(selectedEmoji, 32));
                  setIsOpen(false);
                }}
              />
            </Box>
          )}

          {tabValue === 'custom' && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  startIcon={
                    isUploading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  fullWidth
                >
                  {tr.SvgIconSelect.uploadSvgIcon}
                </Button>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : customIcons.length === 0 ? (
                <Box
                  sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}
                >
                  {tr.SvgIconSelect.noCustomIcons}
                </Box>
              ) : (
                <Grid container spacing={1}>
                  {customIcons.map((icon) => (
                    <Grid item xs={4} key={icon.id}>
                      <Box
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          p: 1,
                          border: '1px solid #ddd',
                          borderRadius: 1,
                          '&:hover': { bgcolor: '#f5f5f5' },
                        }}
                        onClick={() => {
                          setValue(icon.svgContent);
                          setIsOpen(false);
                        }}
                        onMouseEnter={(e) => {
                          const btn = e.currentTarget.querySelector(
                            '[data-delete-btn]',
                          ) as HTMLElement;
                          if (btn) btn.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          const btn = e.currentTarget.querySelector(
                            '[data-delete-btn]',
                          ) as HTMLElement;
                          if (btn) btn.style.opacity = '0';
                        }}
                      >
                        <Box
                          component="img"
                          src={`data:image/svg+xml;utf8,${encodeURIComponent(icon.svgContent)}`}
                          sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: 50,
                          }}
                        />
                        <Tooltip title={tr.SvgIconSelect.delete}>
                          <IconButton
                            data-delete-btn
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmDialog({
                                open: true,
                                iconId: icon.id,
                              });
                            }}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Popover>

      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false })}
      >
        <DialogContent>
          <Box sx={{ mb: 2 }}>{tr.SvgIconSelect.deleteConfirm}</Box>
          {deleteConfirmDialog.iconId && (
            <Box
              component="img"
              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                customIcons.find(
                  (icon) => icon.id === deleteConfirmDialog.iconId,
                )?.svgContent || '',
              )}`}
              sx={{
                width: '100%',
                maxHeight: 100,
                mb: 2,
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 1,
              }}
            />
          )}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setDeleteConfirmDialog({ open: false })}
              variant="outlined"
            >
              {tr.SvgIconSelect.cancel}
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmDialog.iconId) {
                  handleDelete(deleteConfirmDialog.iconId);
                }
              }}
              variant="contained"
              color="error"
            >
              {tr.SvgIconSelect.delete}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
