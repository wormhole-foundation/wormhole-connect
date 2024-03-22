import React from 'react';
import { getChainConfig } from 'utils';
import { makeStyles } from 'tss-react/mui';
import InputContainer from 'components/InputContainer';
import { OPACITY } from 'utils/style';
import { Typography, useTheme } from '@mui/material';
import { RootState } from 'store';
import { useSelector } from 'react-redux';
import Header from './Header';

const useStyles = makeStyles()((theme: any) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: theme.spacing(1),
  },
  link: {
    color: theme.palette.text.primary,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  revertString: {
    wordWrap: 'break-word',
  },
}));

const RelayerDeliveryFailed = () => {
  const { classes } = useStyles();
  const theme: any = useTheme();
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const redeemTx = useSelector((state: RootState) => state.redeem.redeemTx);
  const chainDisplayName = getChainConfig(txData.toChain).displayName;
  return (
    <InputContainer bg={theme.palette.warning[500] + OPACITY[25]}>
      <Header
        chain={txData.toChain}
        address={txData.recipient}
        txHash={redeemTx}
      />
      <div className={classes.root}>
        <Typography>
          {`Your transfer failed to be delivered on ${chainDisplayName}.`}
        </Typography>
        <Typography>
          Please reach out to the Wormhole community on{' '}
          <a
            href="https://discord.com/invite/wormholecrypto"
            target="_blank"
            rel="noreferrer"
            className={classes.link}
          >
            Discord
          </a>{' '}
          if you have questions.
        </Typography>
      </div>
    </InputContainer>
  );
};

export default RelayerDeliveryFailed;
