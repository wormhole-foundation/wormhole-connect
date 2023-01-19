import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import InfoBox from '../../components/InfoBox';
import { RenderRows, RowsData } from '../../components/RenderRows';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px 8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
}));

const automaticRows: RowsData = [
  {
    title: 'Amount',
    value: '20.35 MATIC',
  },
  {
    title: 'Destination gas token amount',
    value: '0.5 FTM',
  },
  {
    title: 'Total fee estimate',
    value: '0.5 MATIC',
    rows: [
      {
        title: 'Relayer fee',
        value: '0.3 MATIC',
      },
    ],
  },
];

const manualRows: RowsData = [
  {
    title: 'Amount',
    value: '20.45 MATIC',
  },
  {
    title: 'Total fee estimates',
    value: '0.5 MATIC & 0.5 FTM',
    rows: [
      {
        title: 'Source chain gas',
        value: '~ 0.5 MATIC',
      },
      {
        title: 'Destination chain gas',
        value: '~ 0.5 FTM',
      },
    ],
  },
];

function TransferSummary() {
  const { classes } = useStyles();
  const selectedOption = useSelector(
    (state: RootState) => state.transfer.destGasPayment,
  );
  const rows =
    selectedOption === PaymentOption.AUTOMATIC ? automaticRows : manualRows;

  return (
    <div className={classes.container}>
      <div className={classes.header}>Transfer summary</div>
      <InfoBox>
        <RenderRows rows={rows} />
      </InfoBox>
    </div>
  );
}

export default TransferSummary;
