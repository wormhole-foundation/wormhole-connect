import React from 'react';
import { makeStyles } from 'tss-react/mui';
import ArrowDownIcon from '../../icons/arrow-down.svg';
import { Collapse } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import InfoBox from '../../components/InfoBox';

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
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '4px 0',
  },
  rowTitle: {
    fontSize: '14px',
    opacity: '70%',
  },
  arrow: {
    height: '24px',
    marginLeft: '8px',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  fees: {
    marginLeft: '16px',
  },
  feeText: {
    fontSize: '14px',
  },
}));

type Row = {
  title: string;
  value: string;
};

interface TransferRow extends Row {
  fees?: Row[];
}

const automaticRows: TransferRow[] = [
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
    fees: [
      {
        title: 'Relayer fee',
        value: '0.3 MATIC',
      },
    ],
  },
];

const manualRows: TransferRow[] = [
  {
    title: 'Amount',
    value: '20.45 MATIC',
  },
  {
    title: 'Total fee estimates',
    value: '0.5 MATIC & 0.5 FTM',
    fees: [
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

function RenderRows(props: { rows: TransferRow[]; small?: boolean }) {
  const { classes } = useStyles();
  const [collapsed, setCollapsed] = React.useState(true);
  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  return (
    <div>
      {props.rows.map((row, i) => (
        <div key={i}>
          <div
            className={classes.row}
            style={{ cursor: row.fees ? 'pointer' : 'default' }}
            onClick={() => row.fees && toggleCollapsed()}
          >
            <div className={classes.row}>
              <span className={classes.rowTitle}>{row.title}</span>
              {row.fees && (
                <img
                  className={`${classes.arrow} ${!collapsed && classes.invert}`}
                  src={ArrowDownIcon}
                  alt="arrow down"
                />
              )}
            </div>
            <div className={`${props.small && classes.feeText}`}>
              {row.value}
            </div>
          </div>
          <div>
            {row.fees && (
              <Collapse in={!collapsed}>
                <div className={classes.fees}>
                  <RenderRows rows={row.fees} small />
                </div>
              </Collapse>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
