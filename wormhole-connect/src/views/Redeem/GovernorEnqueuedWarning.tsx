import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from 'config';
import { GOVERNOR_WHITEPAPER_URL } from 'consts';
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
  const alertContent = (
    <div>
      {`This transfer will take 24 hours to complete as Wormhole has reached the
      daily transfer limit for ${chainConfig?.displayName}.`}{' '}
      <a
        href={GOVERNOR_WHITEPAPER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={classes.link}
      >
        Learn more
      </a>{' '}
      about this temporary security measure.
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
