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
import { useDebouncedCallback } from 'use-debounce';
import { useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';
import Box from '@mui/material/Box';

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
        data-testid="amount-input"
        value={innerValue}
        focused={isFocused}
        onChange={onInnerChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    );
  },
);

type Props = {
  sourceChain?: Chain;
  supportedSourceTokens: Array<Token>;
  tokenBalance: sdkAmount.Amount | null;
  receiveAmount?: number | undefined;
  error?: string;
  warning?: string;
};

/**
 * Renders the input control to set the transaction amount
 */
const AmountInput = (props: Props) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const styles = useMemo(
    () => ({
      amountContainer: {
        width: '100%',
        maxWidth: '250px',
      },
      amountInput: {
        borderRadius: '8px',
        background: theme.palette.input.background,
        border: 'none',
      },
      amountInputEmpty: {
        background: theme.palette.input.background,
        borderColor: theme.palette.input.background,
      },
      amountCardContent: {
        display: 'flex',
        alignItems: 'center',
        height: '50px',
        padding: 0,
        ':last-child': {
          padding: 0,
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
    }),
    [theme],
  );

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

  const { fromChain: sourceChain, isTransactionInProgress } = useSelector(
    (state: RootState) => state.transferInput,
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
    () => isTransactionInProgress || !sourceChain || !sourceToken,
    [isTransactionInProgress, sourceChain, sourceToken],
  );

  const balance = useMemo(() => {
    if (isInputDisabled || !sendingWallet.address) {
      return null;
    }

    return (
      <Stack direction="row" alignItems="center">
        <Typography
          component="span"
          sx={{ ...styles.balance, marginRight: '4px' }}
        >
          Balance:
        </Typography>
        <Typography fontSize={14} textAlign="right" sx={styles.balance}>
          {props.tokenBalance
            ? sdkAmount.display(sdkAmount.truncate(props.tokenBalance, 6))
            : '0'}
        </Typography>
      </Stack>
    );
  }, [
    isInputDisabled,
    sendingWallet.address,
    styles.balance,
    props.tokenBalance,
  ]);

  const handleChange = useCallback((newValue: string): void => {
    setAmountInput(newValue);
  }, []);

  const tokenPrice = useMemo(() => {
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
    <Box sx={styles.amountContainer}>
      <Card
        sx={[styles.amountInput, amountInput === '' && styles.amountInputEmpty]}
      >
        <CardContent sx={styles.amountCardContent}>
          <DebouncedTextField
            fullWidth
            disabled={isInputDisabled}
            placeholder="0"
            slotProps={{
              htmlInput: {
                style: {
                  color: props.error
                    ? theme.palette.error.main
                    : theme.palette.text.primary,
                  fontSize: 24,
                  height: '28px',
                },
                onWheel: (e) => {
                  // IMPORTANT: We need to prevent the scroll behavior on number inputs.
                  // Otherwise it'll increase/decrease the value when user scrolls on the input control.
                  // See for details: https://github.com/mui/material-ui/issues/7960
                  e.currentTarget.blur();
                },
                step: '0.1',
              },
              input: {
                disableUnderline: true,
              },
            }}
            variant="standard"
            value={debouncedAmountInput}
            onChange={handleChange}
            onDebouncedChange={handleDebouncedChange}
          />
        </CardContent>
      </Card>
      <AlertBannerV2
        error={!!props.error}
        content={props.error || props.warning}
        show={!!props.error || !!props.warning}
        color={props.error ? theme.palette.error.main : theme.palette.grey.A400}
        sx={styles.inputError}
      />
    </Box>
  );
};

export default AmountInput;
