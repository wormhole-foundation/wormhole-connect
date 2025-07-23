import React, {
  ChangeEventHandler,
  ComponentProps,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import Box from '@mui/material/Box';

import { Token } from 'config/tokens';
import type { RootState } from 'store';
import { useGetTokens } from 'hooks/useGetTokens';
import {
  formatWithCommas,
  removeCommas,
  isValidDecimalInput,
} from 'utils/formatNumber';

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
    const [innerValue, setInnerValue] = useState<string>(value ?? '');
    const [isFocused, setIsFocused] = useState(false);
    const deferredOnChange = useDebouncedCallback(
      onDebouncedChange,
      INPUT_DEBOUNCE,
    );

    const onInnerChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = removeCommas(e.target.value);

        if (!isValidDecimalInput(value)) {
          return;
        }

        const formattedValue = formatWithCommas(value);

        setInnerValue(formattedValue);
        onChange(value);
        deferredOnChange(value);
      },
      [deferredOnChange, onChange],
    );

    // Propagate any outside changes to the inner TextField value
    // The way we do this is by checking when the focus is not on the input component
    useEffect(() => {
      if (!isFocused) {
        setInnerValue(formatWithCommas(value));
      }
      // We should run this side-effect only when the value changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <TextField
        {...props}
        data-testid="amount-input"
        aria-label="Amount input"
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
  value: string;
  debouncedValue: string;
  supportedSourceTokens: Array<Token>;
  tokenBalance: sdkAmount.Amount | null;
  receiveAmount?: number | undefined;
  error?: string;
  warning?: string;
  onChange: (value: string) => void;
  onDebouncedChange: (value: string) => void;
};

/**
 * Renders the input control to set the transaction amount
 */
function AmountInput(props: Props) {
  const theme = useTheme();

  const htmlInputProps = useMemo(
    () => ({
      maxLength: 24,
      style: {
        color: props.error
          ? theme.palette.error.main
          : theme.palette.text.primary,
        fontSize: '32px',
        height: '32px',
      },
      onWheel: (e: React.WheelEvent<HTMLInputElement>) => {
        // IMPORTANT: We need to prevent the scroll behavior on number inputs.
        // Otherwise it'll increase/decrease the value when user scrolls on the input control.
        // See for details: https://github.com/mui/material-ui/issues/7960
        e.currentTarget.blur();
      },
      step: '0.1',
    }),
    [props.error, theme.palette.error.main, theme.palette.text.primary],
  );

  const styles = useMemo(
    () => ({
      amountContainer: {
        width: '100%',
        maxWidth: '250px',
      },
      amountInput: {
        background: theme.palette.input.background,
        borderRadius: '8px',
        border: 'none',
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
      balance: {
        color: theme.palette.text.secondary,
        fontSize: '14px',
        lineHeight: '14px',
        textAlign: 'right',
      },
    }),
    [theme],
  );

  const { fromChain: sourceChain, isTransactionInProgress } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { sourceToken } = useGetTokens();

  const isInputDisabled =
    isTransactionInProgress || !sourceChain || !sourceToken;

  return (
    <Box sx={styles.amountContainer}>
      <Card sx={styles.amountInput}>
        <CardContent sx={styles.amountCardContent}>
          <DebouncedTextField
            fullWidth
            disabled={isInputDisabled}
            placeholder="0"
            slotProps={{
              htmlInput: htmlInputProps,
              input: {
                disableUnderline: true,
              },
            }}
            variant="standard"
            value={props.debouncedValue ?? ''}
            onChange={props.onChange}
            onDebouncedChange={props.onDebouncedChange}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default memo(AmountInput);
