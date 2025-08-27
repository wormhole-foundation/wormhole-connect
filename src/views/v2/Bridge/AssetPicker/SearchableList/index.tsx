import type { ReactNode } from 'react';
import React, { memo, useMemo } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import { useCustomScrollbar } from 'utils/style';
import type { SxProps, Theme } from '@mui/material';

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
  filterFn?: (item: T, query: string) => boolean;
  onQueryChange: (query: string) => void;
  searchQuery: string;
};

function SearchableList<T>(props: SearchableListProps<T>): ReactNode {
  const scrollbarStyles = useCustomScrollbar();

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

  const { items, filterFn, searchQuery } = props;

  const filteredList = useMemo(() => {
    // Skip filtering if no filterFn provided (already filtered by parent)
    if (!filterFn) {
      return items;
    }

    return items.filter((item) => filterFn(item, searchQuery));
  }, [items, filterFn, searchQuery]);

  return (
    <Box
      sx={{ ...styles.wrapper, ...props.sx }}
      className={props?.className || ''}
    >
      {props.title}
      <SearchInput
        value={props.searchQuery}
        dataTestId={props.dataTestId}
        onChange={props.onQueryChange}
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
