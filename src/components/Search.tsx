import React from 'react';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';
import InputTransparent from './InputTransparent';
import InputContainer from './InputContainer';
import SearchIcon from '../icons/search.svg';

const useStyles = makeStyles((theme: Theme) => ({
  searchContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flexGrow: 1,
  },
  // TODO: make border into prop on InputContainer
  searchBorder: {
    border: `1px solid ${theme.palette.divider}`,
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
      <InputContainer>
        <div className={classes.searchContent}>
          <div className={classes.input}>
            <InputTransparent placeholder={props.placeholder} />
          </div>
          <img src={SearchIcon} alt="search" />
        </div>
      </InputContainer>
    </div>
  );
}

export default Search;
