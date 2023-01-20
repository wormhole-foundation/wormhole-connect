import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';
import InputTransparent from './InputTransparent';
import InputContainer from './InputContainer';
import SearchIcon from '../icons/components/Search';
import { OPACITY } from '../utils/style';

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
    backgroundColor: theme.palette.innerCard.background,
  },
  input: {
    flexGrow: 1,
  },
  // TODO: make border into prop on InputContainer
  searchBorder: {
    border: `1px solid ${theme.palette.divider}${OPACITY[50]}`,
    borderRadius: '8px',
  },
}));

type Props = {
  placeholder?: string;
};

function Search(props: Props) {
  const classes = useStyles();
  return (
    <div className={classes.searchBorder}>
      <div className={classes.container}>
        <div className={classes.searchContent}>
          <div className={classes.input}>
            <InputTransparent placeholder={props.placeholder} />
          </div>
          <SearchIcon />
        </div>
      </div>
    </div>
  );
}

export default Search;
