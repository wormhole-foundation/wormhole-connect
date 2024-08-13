import React from 'react';

import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { makeStyles } from 'tss-react/mui';

import SearchIcon from 'icons/Search';

const useStyles = makeStyles()(() => ({
  input: {
    border: '1px solid #C1BBF6',
    borderRadius: '100vh',
    '& fieldset': {
      border: 'none',
    },
    '& input::placeholder': {
      color: 'white',
      opacity: 0.2,
    },
  },
  icon: {
    height: 20,
    width: 20,
    color: 'white',
    opacity: 0.2,
  },
}));

type SearchInputProps = {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
};

export default function SearchInput(props: SearchInputProps) {
  const { classes } = useStyles();

  return (
    <TextField
      className={classes.input}
      autoFocus
      fullWidth
      inputProps={{
        style: {
          fontSize: 14,
          height: 22,
          lineHeight: 22,
        },
      }}
      placeholder={props.placeholder}
      size="small"
      variant="outlined"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon className={classes.icon} />
          </InputAdornment>
        ),
      }}
    />
  );
}
