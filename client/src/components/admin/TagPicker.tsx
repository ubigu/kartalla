import { Autocomplete, TextField } from '@mui/material';
import { getOrgTags } from '@src/controllers/SurveyController';
import { useTranslations } from '@src/stores/TranslationContext';
import { useEffect, useState } from 'react';
interface Props {
  selectedTags: string[];
  addEnabled: boolean;
  onSelectedTagsChange: (tags: string[]) => void;
}

export function TagPicker({
  selectedTags,
  addEnabled,
  onSelectedTagsChange,
}: Props) {
  const [tags, setTags] = useState([]);

  const { tr } = useTranslations();

  useEffect(() => {
    async function updateOrgTags() {
      try {
        setTags(await getOrgTags());
      } catch {
        // retry after a failure
        setTimeout(updateOrgTags, 2000);
      }
    }
    updateOrgTags();
  }, []);

  const handleTagChange = (_event: any, newValue: string[]) => {
    onSelectedTagsChange(newValue);
  };

  return (
    <Autocomplete
      multiple
      id="tags-outlined"
      freeSolo={addEnabled}
      value={selectedTags}
      options={tags}
      getOptionLabel={(option) => option}
      onChange={handleTagChange}
      defaultValue={[]}
      filterSelectedOptions
      sx={{ width: '100%' }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={
            addEnabled ? tr.TagPicker.addTags : tr.TagPicker.filterWithTags
          }
        />
      )}
    />
  );
}
