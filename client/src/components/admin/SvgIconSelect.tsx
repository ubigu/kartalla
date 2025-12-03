import { MapMarkerIcon, SvgIcon } from '@interfaces/survey';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Tab,
  Tabs,
} from '@mui/material';
import { EmojiPicker } from '@src/components/admin/EmojiPicker';
import { IconGrid } from '@src/components/admin/IconGrid';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
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
  const [tabValue, setTabValue] = useState<'emoji' | 'appIcons' | 'custom'>(
    'emoji',
  );
  const [customIcons, setCustomIcons] = useState<SvgIcon[]>([]);
  const [appIcons, setAppIcons] = useState<MapMarkerIcon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appIconsLoading, setAppIconsLoading] = useState(false);
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
    } else if (isOpen && tabValue === 'appIcons') {
      loadAppIcons();
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

  async function loadAppIcons() {
    try {
      setAppIconsLoading(true);
      const icons = await request<MapMarkerIcon[]>(
        '/api/feature-styles/marker-icons',
      );
      setAppIcons(icons);
    } catch (error) {
      showToast({
        severity: 'error',
        message: 'Failed to load app icons',
      });
    } finally {
      setAppIconsLoading(false);
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
          SelectDisplayProps={{
            onKeyDown: (event) => {
              if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                setIsOpen(true);
              }
            },
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
        <Box sx={{ display: 'flex', flexDirection: 'column', width: 420 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={tr.SvgIconSelect.emoji} value="emoji" />
              <Tab label={tr.SvgIconSelect.appIcons} value="appIcons" />
              <Tab label={tr.SvgIconSelect.customIcons} value="custom" />
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

          {tabValue === 'appIcons' && (
            <Box sx={{ p: 2 }}>
              <IconGrid
                icons={appIcons}
                loading={appIconsLoading}
                emptyMessage={tr.SvgIconSelect.noCustomIcons}
                showDeleteButton={false}
                onSelect={(svgContent) => {
                  setValue(svgContent);
                  setIsOpen(false);
                }}
                onDeleteRequest={() => {}}
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

              <IconGrid
                icons={customIcons}
                loading={isLoading}
                emptyMessage={tr.SvgIconSelect.noCustomIcons}
                showDeleteButton={true}
                onSelect={(svgContent) => {
                  setValue(svgContent);
                  setIsOpen(false);
                }}
                onDeleteRequest={(iconId) => {
                  setDeleteConfirmDialog({
                    open: true,
                    iconId: iconId as number,
                  });
                }}
              />
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
