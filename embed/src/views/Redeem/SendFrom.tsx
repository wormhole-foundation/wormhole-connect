import React from 'react';
import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
// import Confirmations from './Confirmations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { context } from '../../utils/sdk';
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
  if (!vaa) return <div></div>;
  const fromNetwork = context.resolveDomainName(vaa?.emitterChain);
  // const pending = vaa.guardianSignatures < REQUIRED_CONFIRMATIONS;

  return (
    <div>
      <InputContainer>
        <Header
          network={fromNetwork}
          address={vaa.fromAddress!}
          txHash={!pending ? vaa.txHash : undefined}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {/* {pending && <Confirmations confirmations={vaa.guardianSignatures} />} */}
    </div>
  );
}

export default SendFrom;
