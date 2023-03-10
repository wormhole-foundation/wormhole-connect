import React from 'react';
import { makeStyles } from 'tss-react/mui';
import ConnectWallet from '../../../components/ConnectWallet';

import InputContainer from '../../../components/InputContainer';
import { TransferWallet } from '../../../utils/wallet';
import ValidationError from '../ValidationError';
import Input from './Input';

const useStyles = makeStyles()((theme) => ({
  outerContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '158px 1fr',
    gridTemplateRows: '1fr',
    gridTemplateAreas: `"network inputs"`,
    width: '100%',
    maxWidth: '100%',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr !important',
      gridTemplateAreas: `"inputs" !important`,
    },
  },
  network: {
    gridArea: 'network',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  inputs: {
    gridArea: 'inputs',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    paddingLeft: '8px',
  },
  networkRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
  },
  networkSmall: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  tokenIcon: {
    width: '24px',
    height: '24px',
  },
  amtRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px',
    gridTemplateRows: '1fr',
    gridTemplateAreas: `"amount balance"`,
    maxWidth: '100%',
  },
  amount: {
    gridArea: 'amount',
    overflow: 'hidden',
  },
  balance: {
    gridArea: 'balance',
    backgroundColor: 'transparent',
  },
}));

type Props = {
  title: string;
  wallet: TransferWallet;
  walletValidations: string[];
  inputValidations: string[];
  networkTile: any;
  networkTileSmall: any;
  tokenInput: any;
  amountInput: any;
  balance: string | undefined;
};

function Inputs(props: Props) {
  const { classes } = useStyles();

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.headerTitle}>{props.title}</div>
        {/* connect wallet button */}
        <ConnectWallet type={props.wallet} />
      </div>

      {/* wallet validation error banner */}
      <ValidationError validations={props.walletValidations} />

      <InputContainer>
        <div className={classes.outerContainer}>
          <div className={classes.content}>
            {/* network tile */}
            <div className={classes.network}>{props.networkTile}</div>

            <div className={classes.inputs}>
              {/* network/token select */}
              <div className={classes.networkRow}>
                <div className={classes.networkSmall}>
                  {props.networkTileSmall}
                </div>
                {props.tokenInput}
              </div>

              <div className={classes.amtRow}>
                {/* amount input */}
                <div className={classes.amount}>{props.amountInput}</div>

                {/* balance */}
                <div className={classes.balance}>
                  <Input label="Balance">
                    <div>{props.balance || '-'}</div>
                  </Input>
                </div>
              </div>
            </div>
          </div>

          {/* validation error banner */}
          <ValidationError
            validations={props.inputValidations}
            margin="8px 0 0 0"
          />
        </div>
      </InputContainer>
    </div>
  );
}

export default Inputs;
