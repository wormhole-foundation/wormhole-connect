import React, {
  ChangeEventHandler,
  ComponentProps,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebouncedCallback } from 'use-debounce';
import { useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AlertBannerV2 from 'components/v2/AlertBanner';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import { setAmount } from 'store/transferInput';
import type { TokenConfig } from 'config/types';
import type { RootState } from 'store';

const INPUT_DEBOUNCE = 500;

const DebouncedTextField = memo(
  ({
    value,
    onChange,
    ...props
  }: Omit<ComponentProps<typeof TextField>, 'onChange' | 'value'> & {
    value: string;
    onChange: (event: string) => void;
  }) => {
    const [innerValue, setInnerValue] = useState<string>(value);
    const defferedOnChange = useDebouncedCallback(onChange, INPUT_DEBOUNCE);

    const onInnerChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (e) => {
        let value = e.target.value;
        if (value === '.') value = '0.';

        const numValue = Number(value);

        if (isNaN(numValue) || numValue < 0) {
          // allows all but negative numbers
          return;
        }

        setInnerValue(e.target.value);
        defferedOnChange(e.target.value);
      },
      [],
    );

    useEffect(() => {
      setInnerValue(value);
    }, [value]);

    return <TextField {...props} value={innerValue} onChange={onInnerChange} />;
  },
);

const useStyles = makeStyles()((theme) => ({
  amountContainer: {
    width: '100%',
    maxWidth: '420px',
  },
  amountCard: {
    borderRadius: '8px',
  },
  amountCardContent: {
    display: 'flex',
    alignItems: 'center',
  },
  amountTitle: {
    color: theme.palette.text.secondary,
    display: 'flex',
    minHeight: '40px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    marginTop: '12px',
  },
  balance: {
    color: theme.palette.text.secondary,
  },
}));

type Props = {
  supportedSourceTokens: Array<TokenConfig>;
  error?: string;
  warning?: string;
};

/**
 * Renders the input control to set the transaction amount
 */
const AmountInput = (props: Props) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { sending: sendingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const {
    fromChain: sourceChain,
    token: sourceToken,
    amount,
  } = useSelector((state: RootState) => state.transferInput);

  const { balances, isFetching } = useGetTokenBalances(
    sendingWallet?.address || '',
    sourceChain,
    props.supportedSourceTokens || [],
  );

  const tokenBalance = useMemo(
    () => balances?.[sourceToken]?.balance || '0',
    [balances, sourceToken],
  );

  const isInputDisabled = useMemo(
    () => !sourceChain || !sourceToken,
    [sourceChain, sourceToken],
  );

  const balance = useMemo(() => {
    if (isInputDisabled || !sendingWallet.address) {
      return null;
    }

    return (
      <Stack direction="row" alignItems="center">
        <Typography
          fontSize={14}
          textAlign="right"
          sx={{ marginRight: '4px' }}
          className={classes.balance}
        >
          Balance:
        </Typography>
        {isFetching ? (
          <CircularProgress size={14} />
        ) : (
          // TODO AMOUNT HACK... fix amount formatting in amount.Amount balance refactor
          <Typography
            fontSize={14}
            textAlign="right"
            className={classes.balance}
          >
            {parseFloat(tokenBalance).toLocaleString('en', {
              maximumFractionDigits: 6,
            })}
          </Typography>
        )}
      </Stack>
    );
  }, [isInputDisabled, balances, tokenBalance, sendingWallet.address]);

  const maxButton = useMemo(() => {
    return (
      <Button
        sx={{ minWidth: '32px', padding: '4px' }}
        disabled={isInputDisabled || !tokenBalance}
        onClick={() => {
          if (tokenBalance) {
            // TODO: Remove this when useGetTokenBalances returns non formatted amounts
            const trimmedTokenBalance = tokenBalance.replaceAll(',', '');
            dispatch(setAmount(trimmedTokenBalance));
          }
        }}
      >
        <Typography fontSize={14} textTransform="none">
          Max
        </Typography>
      </Button>
    );
  }, [isInputDisabled, tokenBalance]);

  const handleChange = useCallback((newValue: string): void => {
    dispatch(setAmount(newValue));
  }, []);

  return (
    <div className={classes.amountContainer}>
      <div className={classes.amountTitle}>
        <Typography variant="body2">Amount</Typography>
      </div>
      <Card className={classes.amountCard} variant="elevation">
        <CardContent
          className={classes.amountCardContent}
          style={{ paddingBottom: '16px' }}
        >
          <DebouncedTextField
            fullWidth
            disabled={isInputDisabled}
            inputProps={{
              style: {
                color: props.error
                  ? theme.palette.error.light
                  : theme.palette.text.primary,
                fontSize: 24,
                height: '40px',
                padding: '4px',
              },
              onWheel: (e) => {
                // IMPORTANT: We need to prevent the scroll behavior on number inputs.
                // Otherwise it'll increase/decrease the value when user scrolls on the input control.
                // See for details: https://github.com/mui/material-ui/issues/7960
                e.currentTarget.blur();
              },
              step: '0.1',
            }}
            placeholder="0"
            variant="standard"
            value={amount}
            onChange={handleChange}
            InputProps={{
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Stack alignItems="end">
                    {maxButton}
                    {balance}
                  </Stack>
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>
      <AlertBannerV2
        error={!!props.error}
        content={props.error || props.warning}
        show={!!props.error || !!props.warning}
        color={
          props.error ? theme.palette.error.light : theme.palette.grey.A400
        }
        className={classes.inputError}
      />
    </div>
  );
};

export default AmountInput;
