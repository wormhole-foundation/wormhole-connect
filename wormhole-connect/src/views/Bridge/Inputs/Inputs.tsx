import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { CHAINS } from 'config';
import { RootState } from 'store';
import { ValidationErr } from 'store/transferInput';
import { NO_INPUT } from 'utils/style';
import { TransferWallet } from 'utils/wallet';

import ConnectWallet from 'components/ConnectWallet';
import InputContainer from 'components/InputContainer';
import AlertBanner from 'components/AlertBanner';
import ChainTile from '../ChainTile';
import ValidationError from '../ValidationError';
import Input from './Input';
import Select from './Select';
import Price from 'components/Price';
import { getUSDFormat } from 'utils';

const useStyles = makeStyles()((theme) => ({
  outerContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  errorContainer: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0, 1.5),
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
    gridTemplateAreas: `"chain inputs"`,
    width: '100%',
    maxWidth: '100%',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr !important',
      gridTemplateAreas: `"inputs" !important`,
    },
  },
  chain: {
    gridArea: 'chain',
  },
  inputs: {
    gridArea: 'inputs',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    width: '100%',
    paddingLeft: theme.spacing(1.5),
    [theme.breakpoints.down('sm')]: {
      paddingLeft: '0',
    },
  },
  chainRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1.5),
  },
  chainSmall: {
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
  chain: ChainName | undefined;
  chainValidation: ValidationErr;
  onChainClick: any;
  tokenInput: any;
  amountInput: any;
  balance: string | undefined;
  tokenPrice: number | undefined;
};

function Inputs(props: Props) {
  const { classes } = useStyles();

  const { showValidationState: showErrors, isTransactionInProgress } =
    useSelector((state: RootState) => state.transferInput);

  const chainConfig = props.chain && CHAINS[props.chain];
  const selectedChain = chainConfig
    ? { icon: chainConfig.icon, text: chainConfig.displayName }
    : undefined;

  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const usdPrice = useMemo(() => {
    if (props.balance && props.tokenPrice) {
      return getUSDFormat(
        Number.parseFloat(`${props.balance}`) * props.tokenPrice,
      );
    }
    return '';
  }, [props.tokenPrice, props.balance]);

  return (
    <div className={classes.container}>
      <div className={classes.errorContainer}>
        <div className={classes.header}>
          <div className={classes.headerTitle}>{props.title}</div>
          {/* connect wallet button */}
          <ConnectWallet
            type={props.wallet}
            disabled={isTransactionInProgress || !selectedChain}
          />
        </div>

        {/* wallet validation error banner */}
        {props.walletError ? (
          <AlertBanner
            show={!!props.walletError}
            content={props.walletError}
            error
            margin="12px 0 0 0"
          />
        ) : (
          <ValidationError
            validations={props.walletValidations}
            margin="12px 0 0 0"
          />
        )}
      </div>

      <InputContainer>
        <div className={classes.outerContainer}>
          <div className={classes.content}>
            {/* chain tile */}
            {!mobile && (
              <div className={classes.chain}>
                <ChainTile
                  chain={chainConfig}
                  error={!!(showErrors && props.chainValidation)}
                  onClick={props.onChainClick}
                  disabled={isTransactionInProgress}
                />
              </div>
            )}

            <div className={classes.inputs}>
              <div className={classes.chainRow}>
                {/* network select (mobile) */}
                {mobile && (
                  <div className={classes.chainSmall}>
                    <Select
                      label="Network"
                      selected={selectedChain}
                      error={!!(showErrors && props.chainValidation)}
                      onClick={props.onChainClick}
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
                  <Input label="Balance" disabled>
                    <div>
                      {props.balance ? (
                        <div>
                          <div>{props.balance}</div>
                          <Price>{usdPrice}</Price>
                        </div>
                      ) : (
                        NO_INPUT
                      )}
                    </div>
                  </Input>
                </div>
              </div>
            </div>
          </div>

          {/* validation error banner */}
          <ValidationError
            validations={props.inputValidations}
            margin="12px 0 0 0"
          />

          {props.warning && props.warning}
        </div>
      </InputContainer>
    </div>
  );
}

export default Inputs;
