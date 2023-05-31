import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import ConnectWallet from '../../../components/ConnectWallet';
import InputContainer from '../../../components/InputContainer';
import { CHAINS } from '../../../config';
import { RootState } from '../../../store';
import { ValidationErr } from '../../../utils/transferValidation';
import { TransferWallet } from '../../../utils/wallet';
import NetworkTile from '../NetworkTile';
import ValidationError from '../ValidationError';
import Input from './Input';
import Select from './Select';
import AlertBanner from '../../../components/AlertBanner';

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
  errorContainer: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    [theme.breakpoints.down('sm')]: {
      padding: '0',
    },
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
  },
  inputs: {
    gridArea: 'inputs',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    paddingLeft: '8px',
    [theme.breakpoints.down('sm')]: {
      paddingLeft: '0',
    },
  },
  networkRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
  },
  networkSmall: {
    display: 'block',
    width: '40%',
  },
  token: {
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      width: '60%',
    },
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
  walletError: string;
  walletValidations: string[];
  inputValidations: string[];
  warning?: React.ReactNode | null;
  network: ChainName | undefined;
  networkValidation: ValidationErr;
  onNetworkClick: any;
  tokenInput: any;
  amountInput: any;
  balance: string | undefined;
};

function Inputs(props: Props) {
  const { classes } = useStyles();

  const { validate: showErrors, isTransactionInProgress } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const networkConfig = props.network && CHAINS[props.network];
  const selectedNetwork = networkConfig
    ? { icon: networkConfig.icon, text: networkConfig.displayName }
    : undefined;

  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div className={classes.container}>
      <div className={classes.errorContainer}>
        <div className={classes.header}>
          <div className={classes.headerTitle}>{props.title}</div>
          {/* connect wallet button */}
          <ConnectWallet
            type={props.wallet}
            disabled={isTransactionInProgress}
          />
        </div>

        {/* wallet validation error banner */}
        {props.walletError ? (
          <AlertBanner
            show={!!props.walletError}
            content={props.walletError}
            error
            margin="8px 0 0 0"
          />
        ) : (
          <ValidationError
            validations={props.walletValidations}
            margin="8px 0 0 0"
          />
        )}
      </div>

      <InputContainer>
        <div className={classes.outerContainer}>
          <div className={classes.content}>
            {/* network tile */}
            {!mobile && (
              <div className={classes.network}>
                <NetworkTile
                  network={networkConfig}
                  error={!!(showErrors && props.networkValidation)}
                  onClick={props.onNetworkClick}
                  disabled={isTransactionInProgress}
                />
              </div>
            )}

            <div className={classes.inputs}>
              <div className={classes.networkRow}>
                {/* network select (mobile) */}
                {mobile && (
                  <div className={classes.networkSmall}>
                    <Select
                      label="Network"
                      selected={selectedNetwork}
                      error={!!(showErrors && props.networkValidation)}
                      onClick={props.onNetworkClick}
                      editable
                      disabled={isTransactionInProgress}
                    />
                  </div>
                )}
                {/* token select */}
                <div className={classes.token}>{props.tokenInput}</div>
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

          {props.warning && props.warning}
        </div>
      </InputContainer>
    </div>
  );
}

export default Inputs;
