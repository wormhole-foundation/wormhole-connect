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
    display: 'flex',
    width: '100%',
    height: '158px',
  },
  inputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    height: '100%',
    width: '100%',
  },
  tokenIcon: {
    width: '24px',
    height: '24px',
  },
  amtRow: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: '8px',
  },
  balance: {
    maxWidth: '150px',
    flexGrow: 'unset',
    flexShrink: '2',
    backgroundColor: 'transparent',
  },
}));

type Props = {
  title: string;
  wallet: TransferWallet;
  walletValidations: string[];
  inputValidations: string[];
  networkTile: any;
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
            {props.networkTile}

            <div className={classes.inputs}>
              {/* token select */}
              {props.tokenInput}

              <div className={classes.amtRow}>
                {/* amount input */}
                {props.amountInput}

                {/* balance */}
                <Input label="Balance">
                  <div>{props.balance || '-'}</div>
                </Input>
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
