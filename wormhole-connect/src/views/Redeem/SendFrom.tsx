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
    title: 'Convert to native gas token',
    value: '≈ 0.3 MATIC --> FTM',
  },
];

function SendFrom() {
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const txData = useSelector((state: RootState) => state.redeem.txData)!;

  return (
    <div>
      <InputContainer>
        <Header
          network={txData.fromChain}
          address={txData.sender}
          txHash={vaa?.txHash}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {/* {pending && <Confirmations confirmations={vaa.guardianSignatures} />} */}
    </div>
  );
}

export default SendFrom;
