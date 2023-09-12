import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from 'config';
import AlertBanner from 'components/AlertBanner';

const useStyles = makeStyles()((theme) => ({
  link: {
    color: theme.palette.text.primary,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}));

type Props = {
  show: boolean;
  chain: ChainName;
};

const GovernorEnqueuedWarning = (props: Props) => {
  const { classes } = useStyles();
  const chainConfig = CHAINS[props.chain];
  const message = `The daily notional value limit for transfers on ${chainConfig?.displayName} has been exceeded. As a result, the VAA for this transfer is pending. If you have any questions, please open a support ticket on `;

  const alertContent = (
    <div>
      <span>{message}</span>
      <a
        href="https://discord.gg/wormholecrypto"
        target="_blank"
        rel="noopener noreferrer"
        className={classes.link}
      >
        https://discord.gg/wormholecrypto
      </a>
      .
    </div>
  );
  return (
    <AlertBanner
      show={!!props.show}
      content={alertContent}
      error
      margin="0 0 24px 0"
    />
  );
};

export default GovernorEnqueuedWarning;
