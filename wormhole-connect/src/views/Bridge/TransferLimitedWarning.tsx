import React, { useEffect } from 'react';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import useIsTransferLimited from 'hooks/useIsTransferLimited';
import { wh } from 'utils/sdk';
import Dialog from '@mui/material/Dialog';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import CloseIcon from 'icons/Close';
import Button from 'components/Button';
import ClockIcon from 'icons/Clock';
import { makeStyles } from 'tss-react/mui';
import { GOVERNOR_WHITEPAPER_URL } from 'consts';

const useStyles = makeStyles()((theme: any) => ({
  dialog: {
    zIndex: 10,
  },
  paper: {
    borderRadius: 24,
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
      maxHeight: '100%',
      margin: 0,
      borderRadius: 0,
    },
  },
  container: {
    position: 'relative',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
  },
  modal: {
    width: '100%',
    padding: 32,
    position: 'relative',
    maxHeight: 'calc( 100vh - 80px )',
    [theme.breakpoints.down('sm')]: {
      padding: '24px 12px',
      maxHeight: '100%',
    },
  },
  close: {
    color: '#3C3D77',
    position: 'absolute',
    top: '28px',
    right: '28px',
    cursor: 'pointer',
    opacity: '70%',
    zIndex: '10',
    [theme.breakpoints.down('sm')]: {
      top: '12px',
      right: '20px',
    },
  },
  background: {
    background: theme.palette.modal.background,
  },
  icon: {
    textAlign: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 600,
    lineHeight: '32px',
    paddingTop: 24,
    paddingBottom: 24,
    borderBottom: '1px solid #313266',
  },
  text: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    color: '#9495D6',
    paddingTop: 24,
    paddingBottom: 24,
  },
  link: {
    color: '#D5D5EB',
    textDecorationLine: 'underline',
  },
  orange: {
    color: '#E48329',
  },
  clock: {
    width: 64,
    height: 64,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
    gap: 10,
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },
}));

interface TransferLimitedWarningProps {
  fromChain: ChainName | undefined;
  token: string;
}

const TransferLimitedWarning = (props: TransferLimitedWarningProps) => {
  const { classes } = useStyles();
  const { fromChain, token } = props;
  const [open, setOpen] = React.useState(true);
  const isTransferLimited = useIsTransferLimited();

  const handleClose = () => {
    setOpen(false);
  };

  const handleContinue = () => {
    setOpen(false);
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 500);
  };

  useEffect(() => {
    setOpen(true);
  }, [fromChain, token]);

  if (
    isTransferLimited.isLimited &&
    isTransferLimited.reason &&
    isTransferLimited.limits
  ) {
    const chainName = wh.toChainName(isTransferLimited.limits.chainId);

    let message, title;
    if (
      isTransferLimited.reason === 'EXCEEDS_MAX_NOTIONAL' ||
      isTransferLimited.reason === 'EXCEEDS_REMAINING_NOTIONAL'
    ) {
      // TODO: See if its necessary a different message for EXCEEDS_REMAINING_NOTIONAL case
      title = (
        <>
          This transaction will take up to{' '}
          <span className={classes.orange}>24 hours</span> to complete
        </>
      );
      message = (
        <>
          This transaction will take up to 24 hours to process as Wormhole has{' '}
          reached the daily limit for {chainName}.
          <br />
          <br />
          This is a normal and temporary security feature by the Wormhole{' '}
          network.
          <br />
          <br />
          <a href={GOVERNOR_WHITEPAPER_URL} target="_blank" rel="noreferrer">
            Learn more
          </a>{' '}
          about this temporary security measure.
        </>
      );
    } else if (isTransferLimited.reason === 'EXCEEDS_LARGE_TRANSFER_LIMIT') {
      title = (
        <>
          This transaction requires{' '}
          <span className={classes.orange}>24 hours</span> to complete
        </>
      );
      message = (
        <>
          This transaction will take 24 hours to process, as it exceeds the
          Wormhole network's temporary transaction limit of $
          {isTransferLimited.limits.chainBigTransactionSize} on {chainName} for{' '}
          security reasons.
          <br />
          <br />
          You may also split the transaction into smaller transactions less than{' '}
          ${isTransferLimited.limits.chainBigTransactionSize} each to avoid the{' '}
          24 hour security delay.
          <br />
          <br />
          <a href={GOVERNOR_WHITEPAPER_URL} target="_blank" rel="noreferrer">
            Learn more
          </a>{' '}
          about this temporary measure.
        </>
      );
    }
    if (message && title) {
      return (
        <Dialog
          open={open}
          sx={{ borderRadius: 8 }}
          className={classes.dialog}
          classes={{ paper: classes.paper }}
        >
          <ScopedCssBaseline enableColorScheme>
            <div className={classes.container}>
              <CloseIcon
                sx={{ fontSize: 32 }}
                className={classes.close}
                onClick={handleClose}
              />
              <div className={classes.modal}>
                <div className={classes.icon}>
                  <ClockIcon />
                </div>
                <div className={classes.title}>{title}</div>
                <div className={classes.text}>{message}</div>
                <div className={classes.buttonContainer}>
                  <Button link onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleContinue}>Continue</Button>
                </div>
              </div>
            </div>
          </ScopedCssBaseline>
        </Dialog>
      );
    }
    return null;
  }
  return null;
};

export default TransferLimitedWarning;
