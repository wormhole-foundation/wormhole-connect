import React, { useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import SearchIcon from 'icons/Search';
import { Box } from '@mui/material';

type SearchInputProps = {
  value: string;
  dataTestId?: string;
  onChange: (newValue: string) => void;
  onPaste?: (newValue: string) => void;
  placeholder?: string;
};

export default function SearchInput(props: SearchInputProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const styles = useMemo(() => ({
    input: {
      '& fieldset': {
        borderRadius: '100vh',
      },
      '& input::placeholder': {
        color: theme.palette.text.primary,
        opacity: 0.2,
      },
      '& .MuiOutlinedInput-root': {
        '& .MuiOutlinedInput-input::placeholder': {
          fontWeight: 300,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderWidth: '1px',
        },
      },
    },
    icon: {
      height: 20,
      width: 20,
      color: theme.palette.text.primary,
      opacity: 0.2,
    },
  }), [theme]);

  return (
    <Box sx={{ padding: '0 16px' }}>
      <TextField
        sx={styles.input}
        ref={(input) => {
          if (!mobile && input) {
            setTimeout(() => {
              input.querySelector('input')?.focus();
            }, 10);
          }
        }}
        data-testid={`${props.dataTestId}-input`}
        fullWidth
        placeholder={props.placeholder}
        size="small"
        variant="outlined"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={styles.icon} />
              </InputAdornment>
            ),
          },
          htmlInput: {
            style: {
              fontSize: 16,
              height: 22,
              lineHeight: 22,
            },
          },
        }}
      />
    </Box>
  );
}
