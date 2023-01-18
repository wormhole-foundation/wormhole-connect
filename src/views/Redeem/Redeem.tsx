import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../../components/Header';
import Spacer from '../../components/Spacer';

const useStyles = makeStyles(() => ({
  milestoneContent: {
    margin: 'auto',
    maxWidth: '650px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function Redeem() {
  const classes = useStyles();

  return (
    <div className={classes.milestoneContent}>
      <Header text="Bridge" align="center" />
      <Spacer height={40} />
    </div>
  );
}

export default Redeem;
