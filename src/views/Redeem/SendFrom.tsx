import React from 'react';
import { makeStyles } from 'tss-react/mui';
import InputContainer from '../../components/InputContainer';
import { ChainName } from '../../sdk/types';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
import { LinearProgress } from '@mui/material';
import { COL_CENTER } from '../../utils/style';

const useStyles = makeStyles()((theme) => ({
  confirmations: {
    ...COL_CENTER,
    marginTop: '16px',
  },
  confirmationsText: {
    textAlign: 'center',
  },
}));

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
  fromNetwork: ChainName;
  senderAddress: string;
  amount: string;
  relayerFee: string;
  nativeGas: string;
};

function SendFrom(props: Props) {
  const { classes } = useStyles();
  return (
    <div>
      <InputContainer>
        <Header
          network={props.fromNetwork}
          senderAddress={props.senderAddress}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      <div className={classes.confirmations}>
        <LinearProgress variant="determinate" value={70} />
        <div className={classes.confirmationsText}>7 / 10 Confirmations</div>
      </div>
    </div>
  );
}

export default SendFrom;
