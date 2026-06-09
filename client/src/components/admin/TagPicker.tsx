import { Box, Button } from '@mui/material';
import { getOrgTags } from '@src/controllers/SurveyController';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useState } from 'react';
import { Combobox_WIP } from '../core/Combobox';
import { Input } from '../core/Input';

interface Props {
  selectedTags: string[];
  addEnabled: boolean;
  onSelectedTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagPicker({
  selectedTags,
  addEnabled,
  onSelectedTagsChange,
  disabled,
}: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const { tr } = useTranslations();

  useEffect(() => {
    async function updateOrgTags() {
      try {
        setTags(await getOrgTags());
      } catch (error) {
        // retry after a failure
        setTimeout(updateOrgTags, 2000);
      }
    }
    updateOrgTags();
  }, []);

  const handleTagChange = (newValue: string[]) => {
    onSelectedTagsChange(newValue);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      handleTagChange([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  if (addEnabled) {
    return (
      <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <Box sx={{ flex: 1 }}>
          <Combobox_WIP
            label={tr.TagPicker.selectTags}
            multiselect
            value={selectedTags}
            options={tags.map((tag) => ({ value: tag, label: tag }))}
            onMultiChange={handleTagChange}
            disabled={disabled}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <Input
            placeholder={tr.TagPicker.newTag}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            disabled={disabled}
          />
          <Button
            variant="contained"
            onClick={handleAddTag}
            disabled={
              disabled || !newTag.trim() || tags.includes(newTag.trim())
            }
            sx={{ height: '28px' }}
          >
            {tr.TagPicker.add ?? 'Add'}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Combobox_WIP
      label={tr.TagPicker.selectTags}
      multiselect
      value={selectedTags}
      options={tags.map((tag) => ({ value: tag, label: tag }))}
      onMultiChange={handleTagChange}
      disabled={disabled}
      wrapperSx={{ width: '100%' }}
    />
  );
}
