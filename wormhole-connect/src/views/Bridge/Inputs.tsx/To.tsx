import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'ethers';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../../../store';
import { setToNetworksModal } from '../../../store/router';
import { TransferWallet, signSolanaTransaction } from '../../../utils/wallet';
import { TOKENS } from '../../../config';
import { getBalance, getForeignAsset, solanaContext } from '../../../sdk';
import {
  formatBalance,
  setAssociatedTokenAddress,
  setForeignAsset,
} from '../../../store/transfer';

import Inputs from './Inputs';
import Input from './Input';
import Select from './Select';
import InputTransparent from '../../../components/InputTransparent';
import { getWrappedToken, getWrappedTokenId } from '../../../utils';
import { Link, Typography } from '@mui/material';

const { REACT_APP_ATTEST_URL } = process.env;

const useStyles = makeStyles()((theme) => ({
  associatedTokenWarning: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
  },
  link: {
    textDecoration: 'underline',
    opacity: '0.8',
    marginTop: '4px',
    padding: '4px 0',
    cursor: 'pointer',
    '&:hover': {
      opacity: '1',
    },
  },
}));

function ToInputs() {
  const dispatch = useDispatch();
  const { classes } = useStyles();
  const [balance, setBalance] = useState(undefined as string | undefined);
  const [warnings, setWarnings] = useState([] as any[]);

  const {
    validations,
    fromNetwork,
    toNetwork,
    token,
    amount,
    foreignAsset,
    associatedTokenAddress,
  } = useSelector((state: RootState) => state.transfer);
  const wallet = useSelector((state: RootState) => state.wallet.receiving);

  const tokenConfig = TOKENS[token];

  const openToNetworksModal = () => dispatch(setToNetworksModal(true));

  // get balance on destination chain
  useEffect(() => {
    if (!fromNetwork || !toNetwork || !tokenConfig || !wallet.address) {
      return setBalance(undefined);
    }
    const { tokenId } = tokenConfig.tokenId
      ? tokenConfig
      : TOKENS[tokenConfig.wrappedAsset!];
    getBalance(wallet.address, tokenId!, toNetwork).then(
      (res: BigNumber | null) => {
        const balance = formatBalance(toNetwork, tokenConfig, res);
        setBalance(balance[tokenConfig.symbol]);
      },
    );
  }, [tokenConfig, fromNetwork, toNetwork, wallet.address]);

  // check if the destination token contract is deployed
  useEffect(() => {
    const checkWrappedTokenExists = async () => {
      if (!toNetwork || !token) {
        dispatch(setForeignAsset(''));
        return;
      }

      const tokenConfig = TOKENS[token];
      const tokenId = tokenConfig.tokenId
        ? tokenConfig.tokenId
        : getWrappedToken(tokenConfig).tokenId;

      if (!tokenId) {
        throw new Error('Could not retrieve target token info');
      }

      const address = await getForeignAsset(tokenId, toNetwork);
      dispatch(setForeignAsset(address || ''));
    };
    checkWrappedTokenExists();
  }, [toNetwork, token]);

  // token display jsx
  const symbol = tokenConfig && getWrappedToken(tokenConfig).symbol;
  const selectedToken = tokenConfig
    ? { icon: tokenConfig.icon, text: symbol }
    : undefined;
  const tokenInput = <Select label="Asset" selected={selectedToken} />;

  // amount display jsx
  const amountInput = (
    <Input label="Amount">
      <InputTransparent placeholder="-" disabled value={amount || ''} />
    </Input>
  );

  // the associated token account address is deterministic, so we still
  // need to check if there is an account created for that address
  const checkSolanaAssociatedTokenAccount = async (): Promise<boolean> => {
    if (!foreignAsset) return false;
    let tokenId = tokenConfig.tokenId || getWrappedTokenId(tokenConfig);
    const account = await solanaContext().getAssociatedTokenAccount(
      tokenId,
      wallet.address,
    );
    if (account) {
      dispatch(setAssociatedTokenAddress(account.toString()));
      setWarnings([]);
      return true;
    } else {
      setWarnings([associatedTokenWarning]);
      return false;
    }
  };

  const createAssociatedTokenAccount = async () => {
    if (!wallet.address || !token)
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
      wallet.address,
      'finalized',
    );
    // if `tx` is null it means the account already exists
    if (!tx) return setWarnings([]);
    await signSolanaTransaction(tx, TransferWallet.RECEIVING);

    let accountExists = false;
    let retries = 0;
    const checkAccount = setInterval(async () => {
      if (accountExists || retries > 10) {
        clearInterval(checkAccount);
      } else {
        accountExists = await checkSolanaAssociatedTokenAccount();
        retries += 1;
      }
    }, 1000);
  };

  // destination token warnings
  const tokenWarning = (
    <Typography>
      This token is not registered, you must{' '}
      <Link target={'_blank'} variant="inherit" href={REACT_APP_ATTEST_URL}>
        register
      </Link>{' '}
      it before you continue. Newly registered tokens will not have liquid
      markets.
    </Typography>
  );
  const associatedTokenWarning = (
    <div className={classes.associatedTokenWarning}>
      No associated token account exists for your wallet on Solana. You must
      create it before proceeding.
      <div className={classes.link} onClick={createAssociatedTokenAccount}>
        Create account
      </div>
    </div>
  );

  useEffect(() => {
    if (!toNetwork || !token || !wallet.address) return setWarnings([]);
    if (!foreignAsset) return setWarnings([tokenWarning]);
    if (toNetwork === 'solana') {
      checkSolanaAssociatedTokenAccount();
    } else {
      setWarnings([]);
    }
  }, [toNetwork, token, foreignAsset, wallet, associatedTokenAddress]);

  return (
    <Inputs
      title="To"
      wallet={TransferWallet.RECEIVING}
      walletValidations={[validations.receivingWallet]}
      walletError={wallet.error}
      inputValidations={[validations.toNetwork]}
      network={toNetwork}
      networkValidation={validations.toNetwork}
      onNetworkClick={openToNetworksModal}
      tokenInput={tokenInput}
      amountInput={amountInput}
      balance={balance}
      warnings={warnings}
    />
  );
}

export default ToInputs;
