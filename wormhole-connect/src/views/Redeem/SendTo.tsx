import React from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { registerWalletSigner, Wallet } from '../../store/wallet';
import { ParsedVaa } from '../../utils/vaa';
import { claimTransfer } from '../../sdk/sdk';
import Header from './Header';
// import Confirmations from './Confirmations';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { RenderRows } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import { handleConnect } from '../../components/ConnectWallet';

const rows = [
  {
    title: 'Amount',
    value: '20.1 MATIC',
  },
  {
    title: 'Native gas token',
    value: '0.5 FTM',
  },
];

function SendTo() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const toNetwork = useSelector((state: RootState) => state.transfer.toNetwork);
  const destGasPayment = useSelector(
    (state: RootState) => state.transfer.destGasPayment,
  );
  const toAddr = useSelector(
    (state: RootState) => state.wallet.receiving.address,
  );
  // const pending = vaa.guardianSignatures < REQUIRED_CONFIRMATIONS;
  const claim = async () => {
    await registerWalletSigner(Wallet.RECEIVING);
    claimTransfer(toNetwork!, Buffer.from(vaa.bytes));
  }
  const connect = async () => {
    handleConnect(dispatch, theme, Wallet.RECEIVING);
  }

  return (
    <div>
      <InputContainer>
        <Header network={toNetwork!} address={toAddr!} txHash={vaa?.txHash} />
        <RenderRows rows={rows} />
      </InputContainer>
      {destGasPayment === PaymentOption.MANUAL && (
        <>
          <Spacer height={8} />
          {toAddr ? (
            <Button text="Claim" onClick={claim} action />
          ) : (
            <Button text="Connect wallet" onClick={connect} action />
          )}
        </>
      )}
      {/* {pending && <Confirmations confirmations={vaa.guardianSignatures} />} */}
    </div>
  );
}

export default SendTo;
