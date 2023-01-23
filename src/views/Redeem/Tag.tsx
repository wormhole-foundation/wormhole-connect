import React from 'react';
import { makeStyles } from 'tss-react/mui';
import InputContainer from '../../components/InputContainer';
import MAINNET_CONFIG from '../../sdk/config/MAINNET';
import { ChainName } from '../../sdk/types';
import ArrowRight from '../../icons/components/ArrowRight';

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  icon: {
    width: '24px',
    height: '24px',
  },
  network: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
          <div className={classes.network}>
            <img
              className={classes.icon}
              src={fromNetworkConfig.icon}
              alt={fromNetworkConfig.displayName}
            />
            <div>{fromNetworkConfig.displayName}</div>
          </div>
          <ArrowRight />
          <div className={classes.network}>
            <img
              className={classes.icon}
              src={toNetworkConfig.icon}
              alt={toNetworkConfig.displayName}
            />
            <div>{toNetworkConfig.displayName}</div>
          </div>
        </div>
      </InputContainer>
    </div>
  );
}

export default NetworksTag;
