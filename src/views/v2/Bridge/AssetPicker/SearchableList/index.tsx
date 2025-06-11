import React, { memo, useState, ReactNode, useMemo } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import { useCustomScrollbar } from 'utils/style';
import { SxProps, Theme } from '@mui/material';

import SearchInput from './SearchInput';

type SearchableListProps<T> = {
  title?: ReactNode;
  listTitle?: ReactNode;
  searchPlaceholder?: string;
  className?: string;
  items: T[];
  loading?: ReactNode;
  dataTestId?: string;
  sx?: SxProps<Theme>;
  renderFn: (item: T, index: number) => ReactNode;
  filterFn: (item: T, query: string) => boolean;
  onQueryChange?: (query: string) => void;
};

function SearchableList<T>(props: SearchableListProps<T>): ReactNode {
  const scrollbarStyles = useCustomScrollbar();
  const [query, setQuery] = useState('');

  const styles = {
    wrapper: {
      maxHeight: '240px',
      display: 'flex',
      flexDirection: 'column' as const,
      padding: 0,
    },
    searchList: {
      marginTop: '12px',
      overflow: 'auto',
    },
  };

  const { items, filterFn } = props;

  const filteredList = useMemo(() => {
    return items.filter((item) => filterFn(item, query));
  }, [items, filterFn, query]);

  return (
    <Box
      sx={{ ...styles.wrapper, ...props.sx }}
      className={props?.className || ''}
    >
      {props.title}
      <SearchInput
        value={query}
        dataTestId={props.dataTestId}
        onChange={(val: string) => {
          setQuery(val);
          if (props.onQueryChange) {
            props.onQueryChange(val);
          }
        }}
        placeholder={props.searchPlaceholder}
      />
      <List
        sx={{ ...styles.searchList, ...scrollbarStyles }}
        data-testid={props.dataTestId}
      >
        <Box sx={{ padding: '0 16px' }}>{props.listTitle}</Box>
        {props.loading || filteredList.map(props.renderFn)}
      </List>
    </Box>
  );
}

export default memo(SearchableList) as typeof SearchableList;
