import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { BigNumber } from 'ethers';
import { useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setReceiverNativeBalance,
  enableAutomaticTransfer,
  disableAutomaticTransfer,
} from '../../store/transfer';
import { getNativeBalance, isAcceptedToken, PaymentOption } from '../../sdk';
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
import { toDecimals } from '../../utils/balance';
import { getWrappedTokenId } from '../../utils';

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
    foreignAsset,
    associatedTokenAddress,
    isTransactionInProgress,
    balances,
  } = useSelector((state: RootState) => state.transfer);
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );

  // check destination native balance
  useEffect(() => {
    if (!fromNetwork || !toNetwork || !receiving.address) return;
    const networkConfig = CHAINS[toNetwork]!;
    getNativeBalance(receiving.address, toNetwork).then((res: BigNumber) => {
      const tokenConfig = TOKENS[networkConfig.gasToken];
      if (!tokenConfig)
        throw new Error('Could not get native gas token config');
      dispatch(
        setReceiverNativeBalance(toDecimals(res, tokenConfig.decimals, 6)),
      );
    });
  }, [fromNetwork, toNetwork, receiving.address, dispatch]);

  // check if automatic relay option is available
  useEffect(() => {
    if (!fromNetwork || !toNetwork || !token) return;
    const fromConfig = CHAINS[fromNetwork]!;
    const toConfig = CHAINS[toNetwork]!;
    if (fromConfig.automaticRelayer && toConfig.automaticRelayer) {
      const isTokenAcceptedForRelay = async () => {
        const tokenConfig = TOKENS[token]!;
        const tokenId = getWrappedTokenId(tokenConfig);
        const accepted = await isAcceptedToken(tokenId);
        console.log(`automatic relay accepted for ${token} - ${accepted}`);
        if (accepted) {
          dispatch(enableAutomaticTransfer());
        } else {
          dispatch(disableAutomaticTransfer());
        }
      };
      isTokenAcceptedForRelay();
    } else {
      dispatch(disableAutomaticTransfer());
    }
  }, [fromNetwork, toNetwork, token, dispatch]);

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
    foreignAsset,
    associatedTokenAddress,
    balances,
    dispatch,
  ]);
  const valid = isTransferValid(validations);

  const disabled = !valid || isTransactionInProgress;
  const showGasSlider =
    automaticRelayAvail && destGasPayment === PaymentOption.AUTOMATIC;

  return (
    <div className={classes.bridgeContent}>
      <PageHeader title="Bridge" />

      <FromInputs />
      <ToInputs />

      <GasOptions disabled={disabled} />

      <Collapse
        in={showGasSlider}
        sx={
          !showGasSlider
            ? { marginBottom: '-16px', transition: 'margin 0.4s' }
            : {}
        }
      >
        {showGasSlider && <GasSlider disabled={disabled} />}
      </Collapse>

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
