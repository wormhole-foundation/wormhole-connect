import React from 'react';
import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
import Confirmations from './Confirmations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { context, REQUIRED_CONFIRMATIONS } from '../../utils/sdk';
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

type Props = {
  amount: string;
  relayerFee: string;
  nativeGas: string;
  showConfirmations: boolean;
};

function SendFrom(props: Props) {
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  if (!vaa) return <div></div>;
  const fromNetwork = context.resolveDomainName(vaa?.emitterChain);
  return (
    <div>
      <InputContainer>
        <Header
          network={fromNetwork}
          address={vaa.fromAddress!}
          txHash={
            vaa.guardianSignatures >= REQUIRED_CONFIRMATIONS
              ? `${vaa.txHash}`
              : undefined
          }
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {props.showConfirmations &&
        vaa.guardianSignatures < REQUIRED_CONFIRMATIONS && (
          <Confirmations confirmations={vaa.guardianSignatures} />
        )}
    </div>
  );
}

export default SendFrom;
