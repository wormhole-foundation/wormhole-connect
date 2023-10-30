import React, { useEffect, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';
import InputTransparent from './InputTransparent';
import SearchIcon from 'icons/Search';
import { changeOpacity } from 'utils/style';

const useStyles = makeStyles()((theme: any) => ({
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
  value?: string;
  onChange: (
    e?:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onSearch?: () => void;
};

function Search(props: Props) {
  const { classes } = useStyles();
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
    <div className={classes.searchBorder}>
      <div className={classes.container} onClick={focus}>
        <div className={classes.searchContent}>
          <div className={classes.input}>
            <InputTransparent
              value={props.value}
              inputRef={searchEl}
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
