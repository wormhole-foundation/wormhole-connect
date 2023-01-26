import React from 'react';
import { makeStyles } from 'tss-react/mui';
import InputContainer from '../../components/InputContainer';
import { CHAINS } from '../../utils/sdk';
import { ChainName } from '../../sdk/types';
import ArrowRight from '../../icons/components/ArrowRight';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { context } from '../../utils/sdk';
import { ParsedVaa } from '../../utils/vaa';

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

function NetworksTag() {
  const { classes } = useStyles();
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const fromNetwork = context.resolveDomainName(vaa.emitterChain) as ChainName;
  const toNetwork = context.resolveDomainName(vaa.toChain) as ChainName;
  const fromNetworkConfig = CHAINS[fromNetwork]!;
  const toNetworkConfig = CHAINS[toNetwork]!;

  return (
    vaa && (
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
    )
  );
}

export default NetworksTag;
