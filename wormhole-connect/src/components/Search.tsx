import React, { useEffect, useRef, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import InputTransparent from './InputTransparent';
import SearchIcon from 'icons/Search';
import { changeOpacity } from 'utils/style';

type Props = {
  placeholder?: string;
  value?: string;
  onChange: (
    e?:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onSearch?: () => void;
};

function Search(props: Props) {
  const theme = useTheme();
  const styles = useMemo(() => ({
    searchContent: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    container: {
      width: '100%',
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: theme.palette.card.secondary,
    },
    input: {
      flexGrow: 1,
    },
    searchBorder: {
      border: `1px solid ${changeOpacity(theme.palette.divider, 50)}`,
      borderRadius: '8px',
    },
    clickable: {
      cursor: 'pointer',
    },
  }), [theme]);
  const searchEl = useRef(null);

  const focus = () => {
    if (searchEl.current) {
      (searchEl.current as any).focus();
    }
  };

  useEffect(() => {
    focus();
  }, []);

  return (
    <Box sx={styles.searchBorder}>
      <Box sx={styles.container} onClick={focus}>
        <Box sx={styles.searchContent}>
          <Box sx={styles.input}>
            <InputTransparent
              value={props.value}
              inputRef={searchEl}
              placeholder={props.placeholder}
              onChange={props.onChange}
              onEnter={props.onSearch}
            />
          </Box>
          <Box
            onClick={props.onSearch}
            sx={props.onSearch && styles.clickable}
          >
            <SearchIcon />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Search;
