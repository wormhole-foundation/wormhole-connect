import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { ParsedVaa } from '../../utils/vaa';
import { claimTransfer } from '../../utils/sdk';
import Header from './Header';
// import Confirmations from './Confirmations';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { RenderRows } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';

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

const useStyles = makeStyles()((theme) => ({
  claimBtn: {
    marginTop: '8px',
  },
}));

function SendTo() {
  const { classes } = useStyles();
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const toNetwork = useSelector((state: RootState) => state.transfer.toNetwork);
  const destGasPayment = useSelector((state: RootState) => state.transfer.destGasPayment);
  const toAddr = useSelector((state: RootState) => state.wallet.receiving.address);
  // const pending = vaa.guardianSignatures < REQUIRED_CONFIRMATIONS;
  const claim = () => claimTransfer(toNetwork!, vaa.bytes);

  return (
    <div>
      <InputContainer>
        <Header
          network={toNetwork}
          address={toAddr!}
          txHash={vaa?.txHash}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {destGasPayment === PaymentOption.MANUAL && (
        <>
          <Spacer height={8} />
          <Button text="Claim" onClick={claim} action />
        </>
      )}
      {/* {pending && <Confirmations confirmations={vaa.guardianSignatures} />} */}
    </div>
  );
}

export default SendTo;
