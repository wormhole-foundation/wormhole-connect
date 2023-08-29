import React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { setRoute } from '../store/router';

import Header from './Header';
import MenuFull from './MenuFull';
import DownIcon from '../icons/Down';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '40px',
    [theme.breakpoints.down('sm')]: {
      marginBottom: '20px',
    },
  },
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
  description: {
    fontWeight: '300',
    fontSize: '14px',
    opacity: '0.6',
  },
}));

type Props = {
  title: string;
  description?: string;
  back?: boolean;
};

function PageHeader(props: Props) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  function back() {
    dispatch(setRoute('bridge'));
  }

  return (
    <div className={classes.container}>
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
      {props.description && (
        <div className={classes.description}>{props.description}</div>
      )}
    </div>
  );
}

export default PageHeader;
