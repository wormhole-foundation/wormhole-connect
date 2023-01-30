import React from 'react';
import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
// import Confirmations from './Confirmations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ParsedVaa } from '../../utils/vaa';

const rows = [
  {
    title: 'Amount',
    value: '20.45 MATIC',
  },
  {
    title: 'Relayer fee',
    value: '1.5 MATIC',
  },
  {
    title: 'Conver to native gas token',
    value: '≈ 0.3 MATIC --> FTM',
  },
];

function SendFrom() {
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const fromNetwork = useSelector(
    (state: RootState) => state.transfer.fromNetwork,
  );
  const fromAddr = useSelector(
    (state: RootState) => state.wallet.sending.address,
  );

  return (
    <div>
      <InputContainer>
        <Header
          network={fromNetwork}
          address={fromAddr!}
          txHash={vaa?.txHash}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {/* {pending && <Confirmations confirmations={vaa.guardianSignatures} />} */}
    </div>
  );
}

export default SendFrom;
