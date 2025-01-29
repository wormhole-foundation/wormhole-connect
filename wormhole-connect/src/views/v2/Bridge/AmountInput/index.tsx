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
import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';

import AlertBannerV2 from 'components/v2/AlertBanner';
import { setAmount } from 'store/transferInput';
import { Token } from 'config/tokens';
import type { RootState } from 'store';
import { calculateUSDPrice } from 'utils';
import { useGetTokens } from 'hooks/useGetTokens';
import { useTokens } from 'contexts/TokensContext';

const INPUT_DEBOUNCE = 500;

const DebouncedTextField = memo(
  ({
    value,
    onChange,
    onDebouncedChange,
    ...props
  }: Omit<ComponentProps<typeof TextField>, 'value' | 'onChange'> & {
    value: string;
    onChange: (event: string) => void;
    onDebouncedChange: (event: string) => void;
  }) => {
    const [innerValue, setInnerValue] = useState<string>(value);
    const [isFocused, setIsFocused] = useState(false);
    const deferredOnChange = useDebouncedCallback(
      onDebouncedChange,
      INPUT_DEBOUNCE,
    );

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
        onChange(e.target.value); // callback with no delay
        deferredOnChange(e.target.value);
      },
      [deferredOnChange, onChange],
    );

    // Propagate any outside changes to the inner TextField value
    // The way we do this is by checking when the focus is not on the input component
    useEffect(() => {
      if (!isFocused) {
        setInnerValue(value);
      }
      // We should run this sife-effect only when the value changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <TextField
        {...props}
        value={innerValue}
        focused={isFocused}
        onChange={onInnerChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    );
  },
);

const useStyles = makeStyles()((theme: any) => ({
  amountContainer: {
    width: '100%',
    maxWidth: '420px',
  },
  amountInput: {
    borderRadius: '8px',
    background: 'transparent',
    border: `1px solid ${theme.palette.input.border}`,
  },
  amountInputEmpty: {
    background: theme.palette.input.background,
    borderColor: theme.palette.input.background,
  },
  amountCardContent: {
    display: 'flex',
    alignItems: 'center',
    height: '72px',
    padding: '12px 20px',
    ':last-child': {
      padding: '12px 20px',
    },
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
    fontSize: '14px',
    lineHeight: '14px',
    textAlign: 'right',
  },
}));

type Props = {
  sourceChain?: Chain;
  supportedSourceTokens: Array<Token>;
  tokenBalance: sdkAmount.Amount | null;
  isFetchingTokenBalance: boolean;
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
  const { amount } = useSelector((state: RootState) => state.transferInput);

  const [amountInput, setAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );
  const [debouncedAmountInput, setDebouncedAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );

  const { sourceToken } = useGetTokens();

  const { getTokenPrice } = useTokens();

  // Clear the amount input value if the amount is reset outside of this component
  // This can happen if user swaps selected source and destination assets.
  useEffect(() => {
    if (!amount && (amountInput || debouncedAmountInput)) {
      handleChange('');
      handleDebouncedChange('');
    }
    // We should run this sife-effect only when the amount changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const isInputDisabled = useMemo(
    () => !props.sourceChain || !sourceToken,
    [props.sourceChain, sourceToken],
  );

  const balance = useMemo(() => {
    if (isInputDisabled || !sendingWallet.address) {
      return null;
    }

    return (
      <Stack direction="row" alignItems="center">
        <Typography
          className={classes.balance}
          component="span"
          sx={{ marginRight: '4px' }}
        >
          Balance:
        </Typography>
        {props.isFetchingTokenBalance ? (
          <CircularProgress size={14} />
        ) : (
          <Typography
            fontSize={14}
            textAlign="right"
            className={classes.balance}
          >
            {props.tokenBalance
              ? sdkAmount.display(sdkAmount.truncate(props.tokenBalance, 6))
              : '0'}
          </Typography>
        )}
      </Stack>
    );
  }, [
    classes.balance,
    isInputDisabled,
    props.isFetchingTokenBalance,
    props.tokenBalance,
    sendingWallet.address,
  ]);

  const handleChange = useCallback((newValue: string): void => {
    setAmountInput(newValue);
  }, []);

  const tokenPriceAdornment = useMemo(() => {
    const price = calculateUSDPrice(
      getTokenPrice,
      Number(amountInput === '.' ? '0.' : amountInput),
      sourceToken,
    );

    if (!price) {
      return null;
    }

    return (
      <InputAdornment
        position="end"
        sx={{
          position: 'absolute',
          top: '38px',
          margin: 0,
        }}
      >
        <Stack alignItems="start">
          <Typography
            color={theme.palette.text.secondary}
            component="span"
            fontSize="14px"
            lineHeight="14px"
          >
            {price}
          </Typography>
        </Stack>
      </InputAdornment>
    );
  }, [amountInput, getTokenPrice, sourceToken, theme.palette.text.secondary]);

  const handleDebouncedChange = useCallback(
    (newValue: string): void => {
      dispatch(setAmount(newValue));
      setDebouncedAmountInput(newValue);
    },
    [dispatch],
  );

  const maxButton = useMemo(() => {
    const maxButtonDisabled =
      isInputDisabled || !sendingWallet.address || !props.tokenBalance;
    return (
      <Button
        sx={{ minWidth: '32px', padding: '4px' }}
        disabled={maxButtonDisabled}
        onClick={() => {
          if (props.tokenBalance) {
            const tokenBalance = sdkAmount.display(props.tokenBalance);
            handleChange(tokenBalance);
            handleDebouncedChange(tokenBalance);
          }
        }}
      >
        <Typography
          fontSize={14}
          fontWeight={maxButtonDisabled ? 400 : 600}
          textTransform="none"
        >
          Max
        </Typography>
      </Button>
    );
  }, [
    isInputDisabled,
    sendingWallet.address,
    props.tokenBalance,
    handleChange,
    handleDebouncedChange,
  ]);

  return (
    <div className={classes.amountContainer}>
      <div className={classes.amountTitle}>
        <Typography variant="body2">Amount</Typography>
      </div>
      <Card
        className={`${classes.amountInput} ${
          amountInput === '' ? classes.amountInputEmpty : ''
        }`}
      >
        <CardContent className={classes.amountCardContent}>
          <DebouncedTextField
            fullWidth
            disabled={isInputDisabled}
            inputProps={{
              style: {
                color: props.error
                  ? theme.palette.error.main
                  : theme.palette.text.primary,
                fontSize: 24,
                height: '28px',
                marginBottom: tokenPriceAdornment ? '16px' : 0, // make sure there is enough space for token price
                padding: 0,
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
            value={debouncedAmountInput}
            onChange={handleChange}
            onDebouncedChange={handleDebouncedChange}
            InputProps={{
              disableUnderline: true,
              startAdornment: tokenPriceAdornment,
              endAdornment: (
                <InputAdornment position="end">
                  <Stack alignItems="end" justifyContent="space-between">
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
        color={props.error ? theme.palette.error.main : theme.palette.grey.A400}
        className={classes.inputError}
      />
    </div>
  );
};

export default AmountInput;
