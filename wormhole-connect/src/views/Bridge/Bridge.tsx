import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { BigNumber, constants } from 'ethers';
import { useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setBalance,
  formatBalance,
  setAutomaticRelayAvail,
  setDestGasPayment,
  setToken,
  touchValidations,
} from '../../store/transfer';
import { getForeignAsset, getNativeBalance, PaymentOption } from '../../sdk';
import { CHAINS, TOKENS } from '../../config';
import { isTransferValid, validate } from '../../utils/transferValidation';

import GasOptions from './GasOptions';
import GasSlider from './NativeGasSlider';
import Preview from './Preview';
import Send from './Send';
import { Collapse } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import FromNetworksModal from './Modals/FromNetworksModal';
import ToNetworksModal from './Modals/ToNetworksModal';
import TokensModal from './Modals/TokensModal';
import FromInputs from './Inputs.tsx/From';
import ToInputs from './Inputs.tsx/To';
import { getWrappedToken } from '../../utils';

const useStyles = makeStyles()((theme) => ({
  bridgeContent: {
    margin: 'auto',
    maxWidth: '650px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
}));

function Bridge() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const {
    validations,
    fromNetwork,
    toNetwork,
    token,
    amount,
    destGasPayment,
    automaticRelayAvail,
    toNativeToken,
    relayerFee,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transfer);
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );

  // clear token if not supported on the selected network
  useEffect(() => {
    if (!fromNetwork || !token) return;
    const tokenConfig = TOKENS[token];
    if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== fromNetwork) {
      dispatch(setToken(''));
    }
  }, [fromNetwork, token]);

  // check destination native balance
  useEffect(() => {
    if (!fromNetwork || !toNetwork || !receiving.address) return;
    const networkConfig = CHAINS[toNetwork]!;
    getNativeBalance(receiving.address, toNetwork).then((res: BigNumber) => {
      const tokenConfig = TOKENS[networkConfig.gasToken];
      if (!tokenConfig)
        throw new Error('Could not get native gas token config');
      dispatch(setBalance(formatBalance(fromNetwork, tokenConfig, res)));
    });
  }, [fromNetwork, toNetwork, receiving.address]);

  // check if automatic relay option is available
  useEffect(() => {
    if (!fromNetwork || !toNetwork) return;
    const fromConfig = CHAINS[fromNetwork]!;
    const toConfig = CHAINS[toNetwork]!;
    if (fromConfig.automaticRelayer && toConfig.automaticRelayer) {
      dispatch(setAutomaticRelayAvail(true));
      dispatch(setDestGasPayment(PaymentOption.AUTOMATIC));
    } else {
      dispatch(setAutomaticRelayAvail(false));
      dispatch(setDestGasPayment(PaymentOption.MANUAL));
    }
  }, [fromNetwork, toNetwork]);

  // validate transfer inputs
  useEffect(() => {
    validate(dispatch);
  }, [
    sending,
    receiving,
    fromNetwork,
    toNetwork,
    token,
    destGasPayment,
    automaticRelayAvail,
    toNativeToken,
    relayerFee,
  ]);
  // show validations when everything is filled out
  useEffect(() => {
    if (
      sending.address &&
      receiving.address &&
      fromNetwork &&
      toNetwork &&
      token &&
      amount &&
      amount >= 0
    ) {
      dispatch(touchValidations());
    }
  }, [sending, receiving, fromNetwork, toNetwork, token, amount]);
  const valid = isTransferValid(validations);

  const disabled = !valid || isTransactionInProgress;

  return (
    <div className={classes.bridgeContent}>
      <PageHeader title="Bridge" />

      <FromInputs />
      <ToInputs />

      <GasOptions disabled={disabled} />

      {automaticRelayAvail && (
        <Collapse in={destGasPayment === PaymentOption.AUTOMATIC}>
          <GasSlider disabled={disabled} />
        </Collapse>
      )}

      <Preview collapsed={!valid} />

      <Send valid={!!valid} />

      {/* modals */}
      <FromNetworksModal />
      <ToNetworksModal />
      <TokensModal />
    </div>
  );
}

export default Bridge;
