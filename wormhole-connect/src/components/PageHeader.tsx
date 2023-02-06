import React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { setRoute } from '../store/router';
import Header from './Header';
import MenuFull from './MenuFull';
import DownIcon from '../icons/components/Down';

const useStyles = makeStyles()((theme) => ({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  arrowBack: {
    transform: 'rotate(90deg)',
    marginRight: '16px',
    cursor: 'pointer',
  },
}));

function PageHeader(props: { title: string; back?: boolean }) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  function back() {
    dispatch(setRoute('bridge'));
  }

  return (
    <div className={classes.header}>
      <div className={classes.left}>
        {props.back && (
          <DownIcon
            className={classes.arrowBack}
            fontSize="large"
            onClick={back}
          />
        )}
        <Header text={props.title} align="left" />
      </div>
      <MenuFull />
    </div>
  );
}

export default PageHeader;
