import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';
import InputTransparent from './InputTransparent';
import SearchIcon from '../icons/components/Search';
import { changeOpacity } from '../utils/style';

const useStyles = makeStyles((theme: Theme) => ({
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
  // TODO: make border into prop on InputContainer
  searchBorder: {
    border: `1px solid ${changeOpacity(theme.palette.divider, 50)}`,
    borderRadius: '8px',
  },
  clickable: {
    cursor: 'pointer',
  },
}));

type Props = {
  placeholder?: string;
  onChange: (
    e?:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onSearch?: React.MouseEventHandler<HTMLDivElement>;
};

function Search(props: Props) {
  const classes = useStyles();

  return (
    <div className={classes.searchBorder}>
      <div className={classes.container}>
        <div className={classes.searchContent}>
          <div className={classes.input}>
            <InputTransparent
              placeholder={props.placeholder}
              onChange={props.onChange}
              onEnter={props.onSearch}
            />
          </div>
          <div
            onClick={props.onSearch}
            className={props.onSearch && classes.clickable}
          >
            <SearchIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;
