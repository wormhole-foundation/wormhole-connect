import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { RootState } from 'store';
import {
  setAssociatedTokenAddress,
  setForeignAsset,
} from 'store/transferInput';
import { ATTEST_URL, TOKENS } from 'config';
import { Route } from 'config/types';
import { getWrappedTokenId } from 'utils';
import { TransferWallet, signSolanaTransaction } from 'utils/wallet';
import { joinClass } from 'utils/style';
import { solanaContext } from 'utils/sdk';
import RouteOperator from 'utils/routes/operator';

import { CircularProgress, Link, Typography } from '@mui/material';
import AlertBanner from 'components/AlertBanner';

const useStyles = makeStyles()((theme: any) => ({
  associatedTokenWarning: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
  },
  link: {
    textDecoration: 'underline',
    opacity: '0.8',
    padding: '4px 0',
    cursor: 'pointer',
    '&:hover': {
      opacity: '1',
    },
  },
  disabled: {
    cursor: 'not-allowed',
    opacity: '0.6',
    '&:hover': {
      opacity: '0.6',
    },
  },
  inProgress: {
    marginRight: '8px',
  },
  error: {
    color: theme.palette.error[500],
    marginTop: '4px',
  },
}));

type Props = {
  createAssociatedTokenAccount: any;
};
function AssociatedTokenWarning(props: Props) {
  const { classes } = useStyles();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState('');

  const createAccount = async () => {
    // if `createAccount` is already in progress, disable function
    if (inProgress) return;
    setInProgress(true);
    setError('');
    try {
      await props.createAssociatedTokenAccount();
      setError('');
    } catch (e) {
      setError('Encountered an error, please try again.');
      console.error(e);
    } finally {
      setInProgress(false);
    }
  };

  return (
    <div className={classes.associatedTokenWarning}>
      No associated token account exists for your wallet on Solana. You must
      create it before proceeding.
      {error && <div className={classes.error}>{error}</div>}
      <div
        className={joinClass([classes.link, inProgress && classes.disabled])}
        onClick={createAccount}
      >
        {inProgress && (
          <CircularProgress size={18} className={classes.inProgress} />
        )}
        Create account
      </div>
    </div>
  );
}

function TokenWarnings() {
  const dispatch = useDispatch();

  const { toChain, token, foreignAsset, associatedTokenAddress, route } =
    useSelector((state: RootState) => state.transferInput);
  const { receiving } = useSelector((state: RootState) => state.wallet);
  const [showErrors, setShowErrors] = useState(false);

  const tokenConfig = TOKENS[token];

  // check if the destination token contract is deployed
  useEffect(() => {
    const checkWrappedTokenExists = async () => {
      if (!toChain || !tokenConfig) {
        dispatch(setForeignAsset(''));
        setShowErrors(false);
        return;
      }

      const tokenId = getWrappedTokenId(tokenConfig);

      if (!tokenId) {
        throw new Error('Could not retrieve target token info');
      }

      // TODO:
      const r = route || Route.Bridge;
      const address = await RouteOperator.getForeignAsset(r, tokenId, toChain);
      if (address) {
        dispatch(setForeignAsset(address));
        setShowErrors(false);
      } else {
        dispatch(setForeignAsset(''));
        setShowErrors(true);
      }
    };
    checkWrappedTokenExists();
  }, [toChain, tokenConfig, route, dispatch]);

  // the associated token account address is deterministic, so we still
  // need to check if there is an account created for that address
  const checkSolanaAssociatedTokenAccount =
    useCallback(async (): Promise<boolean> => {
      if (!foreignAsset || !tokenConfig) {
        setShowErrors(false);
        return false;
      }
      let tokenId = getWrappedTokenId(tokenConfig);
      const account = await solanaContext().getAssociatedTokenAccount(
        tokenId,
        receiving.address,
      );
      // only set address if that actual account exists
      if (account) {
        dispatch(setAssociatedTokenAddress(account.toString()));
        setShowErrors(false);
        return true;
      } else {
        dispatch(setAssociatedTokenAddress(''));
        setShowErrors(true);
        return false;
      }
    }, [foreignAsset, tokenConfig, receiving, dispatch]);

  const createAssociatedTokenAccount = useCallback(async () => {
    if (!receiving.address || !token)
      throw new Error(
        'Must fill in all fields before you can create a token account',
      );
    if (!foreignAsset)
      throw new Error(
        'The token must be registered on Solana before an associated token account can be created',
      );
    const tokenId = getWrappedTokenId(tokenConfig);
    const tx = await solanaContext().createAssociatedTokenAccount(
      tokenId,
      receiving.address,
      'finalized',
    );
    // if `tx` is null it means the account already exists
    if (!tx) return;
    await signSolanaTransaction(tx, TransferWallet.RECEIVING);

    let accountExists = false;
    let retries = 0;
    return await new Promise((resolve) => {
      const checkAccount = setInterval(async () => {
        if (accountExists || retries > 20) {
          clearInterval(checkAccount);
          resolve(true);
        } else {
          accountExists = await checkSolanaAssociatedTokenAccount();
          retries += 1;
        }
      }, 1000);
    });
  }, [
    token,
    receiving,
    foreignAsset,
    tokenConfig,
    checkSolanaAssociatedTokenAccount,
  ]);

  useEffect(() => {
    if (!toChain || !token || !receiving.address) return;
    if (toChain === 'solana' && foreignAsset) {
      checkSolanaAssociatedTokenAccount();
    }
  }, [
    toChain,
    token,
    foreignAsset,
    receiving,
    associatedTokenAddress,
    checkSolanaAssociatedTokenAccount,
  ]);

  const noForeignAssetWarning = (
    <Typography>
      This token is not registered, you must{' '}
      <Link target={'_blank'} variant="inherit" href={ATTEST_URL}>
        register
      </Link>{' '}
      it before you continue. Newly registered tokens will not have liquid
      markets.
    </Typography>
  );
  const noAssociatedTokenAccount = (
    <AssociatedTokenWarning
      createAssociatedTokenAccount={createAssociatedTokenAccount}
    />
  );

  const content = !foreignAsset
    ? noForeignAssetWarning
    : toChain === 'solana' && noAssociatedTokenAccount;

  return (
    <AlertBanner
      show={showErrors}
      content={content}
      warning
      margin="8px 0 0 0"
    />
  );
}

export default TokenWarnings;
