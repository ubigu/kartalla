import { Box, MenuItem, Select as MuiSelect, SelectProps } from '@mui/material';

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseSelectProps extends Omit<SelectProps, 'label'> {
  label?: string;
  options: SelectOption[];
}

/**
 * Compact labeled select dropdown styled to the admin design system.
 */
export function BaseSelect({
  label,
  options,
  id,
  sx,
  ...props
}: BaseSelectProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {label && (
        <label
          htmlFor={id as string}
          style={{ fontSize: '12px', color: '#008577', lineHeight: 'normal' }}
        >
          {label}
        </label>
      )}
      <MuiSelect
        inputProps={{ id: id as string }}
        sx={{
          height: '28px',
          fontSize: '14px',
          backgroundColor: 'white',
          color: '#515b68',
          '& .MuiOutlinedInput-notchedOutline': {
            border: '0.5px solid #E9ECEF',
            borderRadius: '3px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            border: '0.5px solid #E9ECEF',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: '1px solid',
            borderColor: 'primary.main',
          },
          '& .MuiSelect-select': {
            padding: '0 6px',
            paddingRight: '28px !important',
            display: 'flex',
            alignItems: 'center',
          },
          boxShadow: 'inset 0px 1px 2px 0px rgba(89, 120, 134, 0.15)',
          ...sx,
        }}
        {...props}
      >
        {options.map((opt) => (
          <MenuItem
            key={opt.value}
            value={opt.value}
            sx={{ fontSize: '14px', color: '#515b68' }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </MuiSelect>
    </Box>
  );
}
