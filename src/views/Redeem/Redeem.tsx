import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../../components/Header';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import { Theme } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import Stepper from './Stepper';
import { LINK } from '../../utils/style';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useDispatch } from 'react-redux';
import { fetchVaa } from '../../utils/vaa';
import { setVaa } from '../../store/redeem';

const useStyles = makeStyles((theme: Theme) => ({
  milestoneContent: {
    margin: 'auto',
    maxWidth: '700px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: LINK(theme),
  redirectIcon: {
    marginLeft: '8px',
  },
}));

function Redeem() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const vaaData = fetchVaa();
  dispatch(setVaa(vaaData));
  const vaa = useSelector((state: RootState) => state.redeem.vaa);

  return (
    vaa && (
      <div className={classes.milestoneContent}>
        <Header text="Bridge" align="center" />
        <Spacer height={40} />
        <NetworksTag />
        <a
          className={classes.link}
          href="https://wormhole.com/"
          target="_blank"
          rel="noreferrer"
        >
          <div>View on Wormhole Explorer</div>
          <LaunchIcon />
        </a>
        <Stepper />
        <Spacer height={60} />
      </div>
    )
  );
}

export default Redeem;
