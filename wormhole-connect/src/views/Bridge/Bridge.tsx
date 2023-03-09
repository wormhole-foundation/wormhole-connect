import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { BigNumber } from 'ethers';
import { useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  PaymentOption,
  setBalance,
  formatBalance,
  setAutomaticRelayAvail,
  setDestGasPayment,
} from '../../store/transfer';
import { getNativeBalance } from '../../sdk/sdk';
import { CHAINS, TOKENS } from '../../sdk/config';
import { isTransferValid, validate } from '../../utils/transferValidation';

import Spacer from '../../components/Spacer';
import GasOptions from './GasOptions';
import GasSlider from './NativeGasSlider';
import Preview from './Preview';
import Send from './Send';
import { Collapse } from '@mui/material';
import AlertBanner from '../../components/AlertBanner';
import PageHeader from '../../components/PageHeader';
import FromNetworksModal from './Modals/FromNetworksModal';
import ToNetworksModal from './Modals/ToNetworksModal';
import TokensModal from './Modals/TokensModal';
import FromInputs from './Inputs.tsx/From';
import ToInputs from './Inputs.tsx/To';

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
    destGasPayment,
    automaticRelayAvail,
    toNativeToken,
    relayerFee,
  } = useSelector((state: RootState) => state.transfer);
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );

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

  const valid = isTransferValid(validations);

  return (
    <div className={classes.bridgeContent}>
      <PageHeader title="Bridge" />

      <FromInputs />
      <ToInputs />

      <GasOptions disabled={!valid} />

      {automaticRelayAvail && (
        <Collapse in={destGasPayment === PaymentOption.AUTOMATIC}>
          <GasSlider disabled={!valid} />
        </Collapse>
      )}

      <Preview collapsed={!valid} />

      <AlertBanner
        show={!!valid && destGasPayment === PaymentOption.MANUAL}
        text="This transfer will require two transactions - one on the source chain and one on the destination chain."
        warning
      />

      <Send valid={!!valid} />
      <Spacer height={60} />

      {/* modals */}
      <FromNetworksModal />
      <ToNetworksModal />
      <TokensModal />
    </div>
  );
}

export default Bridge;
