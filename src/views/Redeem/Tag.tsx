import React from 'react';
import { makeStyles } from 'tss-react/mui';
import InputContainer from '../../components/InputContainer';
import MAINNET_CONFIG from '../../sdk/config/MAINNET';
import { ChainName } from '../../sdk/types';
import ArrowRightIcon from '../../icons/arrow-right.svg';

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: '24px',
    height: '24px',
    marginRight: '8px',
  },
  arrow: {
    padding: '0 16px',
  },
}));

type Props = {
  fromNetwork: ChainName;
  toNetwork: ChainName;
};

function NetworksTag(props: Props) {
  const { classes } = useStyles();
  const fromNetworkConfig = MAINNET_CONFIG.chains[props.fromNetwork]!;
  const toNetworkConfig = MAINNET_CONFIG.chains[props.toNetwork]!;
  return (
    <div>
      <InputContainer>
        <div className={classes.row}>
          <img className={classes.icon} src={fromNetworkConfig.icon} alt={fromNetworkConfig.displayName} />
          <div>{fromNetworkConfig.displayName}</div>
          <img className={classes.arrow} src={ArrowRightIcon} alt="arrow right" />
          <img className={classes.icon} src={toNetworkConfig.icon} alt={toNetworkConfig.displayName} />
          <div>{toNetworkConfig.displayName}</div>
        </div>
      </InputContainer>
    </div>
  );
}

export default NetworksTag;
