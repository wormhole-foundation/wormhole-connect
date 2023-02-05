import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import BridgeCollapse from './Collapse';
import { CHAINS, TOKENS } from '../../sdk/config';
import { TokenConfig } from '../../config/types';

const getRows = (
  token: TokenConfig,
  gasToken: string,
  payment: PaymentOption,
  amount: number,
  nativeTokenAmt: number,
): RowsData => {
  const receivingToken = token.wrappedAsset || token.symbol;
  
  // TODO: calculate automatic receive amount
  if (payment === PaymentOption.AUTOMATIC) {
    return [
      {
        title: 'Amount',
        value: `${amount - 0.01} ${receivingToken}`,
      },
      {
        title: 'Native token on destination',
        value: `${nativeTokenAmt} ${gasToken}`,
      },
      {
        title: 'Total fee estimate',
        value: `0.5 ${token.symbol}`,
        rows: [
          {
            title: 'Relayer fee',
            value: `0.3 ${token.symbol}`,
          },
          {
            title: 'Source chain gas estimate',
            value: `~ 0.3 ${token.symbol}`,
          },
          {
            title: 'Destination chain gas estimate',
            value: `~ 0.3 ${token.symbol}`,
          },
        ],
      },
    ];
  }
  return [
    {
      title: 'Amount',
      value: `${amount} ${receivingToken}`,
    },
    {
      title: 'Total fee estimates',
      value: `0.5 ${token.symbol} & 0.5 ${gasToken}`,
      rows: [
        {
          title: 'Source chain gas estimate',
          value: `~ 0.5 ${token.symbol}`,
        },
        {
          title: 'Destination chain gas estimate',
          value: `~ 0.5 ${gasToken}`,
        },
      ],
    },
  ];
};

function Preview(props: { collapsed: boolean }) {
  const [state, setState] = React.useState({ rows: [] as RowsData });
  const { token, toNetwork, destGasPayment, amount, toNativeToken } = useSelector(
    (state: RootState) => state.transfer,
  );
  useEffect(() => {
    const destConfig = toNetwork && CHAINS[toNetwork];
    const tokenConfig = token && TOKENS[token];
    if (!tokenConfig || !destConfig || !amount || !toNativeToken) return
    if (tokenConfig && destConfig) {
      const rows = getRows(tokenConfig, destConfig!.nativeToken, destGasPayment, amount, toNativeToken);
      setState({ rows });
    }
  }, [token, toNetwork, destGasPayment]);

  return (
    <BridgeCollapse
      title="Preview"
      disabled={props.collapsed}
      controlled
      value={props.collapsed}
    >
      <InputContainer border styles={{ boxShadow: 'none' }}>
        <RenderRows rows={state.rows} />
      </InputContainer>
    </BridgeCollapse>
  );
}

export default Preview;
