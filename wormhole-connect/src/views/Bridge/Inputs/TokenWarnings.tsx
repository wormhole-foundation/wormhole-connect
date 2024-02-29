import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { RootState } from 'store';
import {
  setAssociatedTokenAddress,
  setForeignAsset,
} from 'store/transferInput';
import { ATTEST_URL, USDC_BRIDGE_URL, TOKENS } from 'config';
import { getWrappedTokenId } from 'utils';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import { joinClass } from 'utils/style';
import { solanaContext } from 'utils/sdk';

import { CircularProgress, Link, Typography } from '@mui/material';
import AlertBanner from 'components/AlertBanner';
import RouteOperator from 'routes/operator';
import { Route } from '../../../config/types';
import { CCTPManual_CHAINS as CCTP_CHAINS } from 'routes/cctpManual';

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
export function AssociatedTokenWarning(props: Props) {
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

  const {
    toChain,
    fromChain,
    token,
    destToken,
    foreignAsset,
    associatedTokenAddress,
    route,
  } = useSelector((state: RootState) => state.transferInput);
  const { receiving } = useSelector((state: RootState) => state.wallet);
  const [showErrors, setShowErrors] = useState(false);
  const [usdcAndNoCCTP, setUsdcAndNoCCTP] = useState(false);

  const tokenConfig = TOKENS[token];
  const destTokenConfig = TOKENS[destToken];

  // check if the destination token contract is deployed
  useEffect(() => {
    // Avoid race conditions
    let active = true;
    const checkWrappedTokenExists = async () => {
      if (!toChain || !tokenConfig || !route) {
        dispatch(setForeignAsset(''));
        setShowErrors(false);
        return;
      }

      const tokenId = getWrappedTokenId(tokenConfig);

      if (!tokenId) {
        throw new Error('Could not retrieve target token info');
      }

      const address = await RouteOperator.getForeignAsset(
        route,
        tokenId,
        toChain,
      );

      if (!active) return;
      if (address) {
        dispatch(setForeignAsset(address));
        setShowErrors(false);
      } else {
        dispatch(setForeignAsset(''));
        setShowErrors(true);
      }
    };
    checkWrappedTokenExists();
    return () => {
      active = false;
    };
  }, [toChain, tokenConfig, route, dispatch]);

  // the associated token account address is deterministic, so we still
  // need to check if there is an account created for that address
  const checkSolanaAssociatedTokenAccount =
    useCallback(async (): Promise<boolean> => {
      if (!foreignAsset || !tokenConfig) {
        setShowErrors(false);
        return false;
      }
      const tokenId = getWrappedTokenId(tokenConfig);
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
    await signAndSendTransaction('solana', tx, TransferWallet.RECEIVING);

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
    // if the url it's empty that means the user doesn't want this feature
    const cctpWarningFlag = !!USDC_BRIDGE_URL;
    // check if the tokens will be wrapped USDC
    const isResultWrappedUSDC =
      tokenConfig?.symbol === 'USDC' &&
      destTokenConfig?.symbol === 'USDC' &&
      destTokenConfig?.nativeChain !== toChain;
    // check if the chains support CCTP
    const bothChainsSupportCCTP =
      toChain &&
      CCTP_CHAINS.includes(toChain) &&
      fromChain &&
      CCTP_CHAINS.includes(fromChain);
    // check if the result is wrapped USDC and the chains involved support CCTP
    // rationale:
    // - transferring wrapped USDC back home (unwrapping) shouldn't be a warning
    // - CCTP would show as USDC on both ends, but the result would be native (the same check as above)
    // - if both chains don't support CCTP, it doesn't make sense to suggest using it,
    //   (at least not with this warning) as the user doesn't have a clear alternative
    //   and using the USDC (CCTP) only bridge wouldn't help
    const usdcAndNoCCTP =
      cctpWarningFlag && isResultWrappedUSDC && bothChainsSupportCCTP;

    if (!toChain || !token || !receiving.address) return;
    // The tBTC associated token account will be created if it doesn't exist in the redeem tx
    if (toChain === 'solana' && foreignAsset && route !== Route.TBTC) {
      checkSolanaAssociatedTokenAccount();
    }
    if (usdcAndNoCCTP) {
      setShowErrors(true);
      setUsdcAndNoCCTP(true);
    } else {
      setShowErrors(false);
      setUsdcAndNoCCTP(false);
    }
  }, [
    toChain,
    token,
    foreignAsset,
    receiving,
    associatedTokenAddress,
    checkSolanaAssociatedTokenAccount,
    route,
    tokenConfig?.symbol,
    tokenConfig?.nativeChain,
    destTokenConfig?.symbol,
    destTokenConfig?.nativeChain,
    fromChain,
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

  // warning message for users that attempt to transfer USDC using a different corridor than CCTP
  const warningNoCCTPOption = (
    <Typography>
      This transaction will transfer wrapped USDC (wUSDC) to the destination
      chain. If you want to transfer native USDC on chains supported by Circle's
      CCTP, use the{' '}
      <Link target={'_blank'} variant="inherit" href={USDC_BRIDGE_URL}>
        USDC Bridge
      </Link>
      .
    </Typography>
  );

  let content;
  if (!foreignAsset) {
    content = noForeignAssetWarning;
  } else if (toChain === 'solana' && route !== Route.Relay) {
    content = noAssociatedTokenAccount;
  } else if (usdcAndNoCCTP) {
    content = warningNoCCTPOption;
  }

  return (
    <AlertBanner
      show={showErrors}
      content={content}
      warning
      margin="12px 0 0 0"
    />
  );
}

export default TokenWarnings;
