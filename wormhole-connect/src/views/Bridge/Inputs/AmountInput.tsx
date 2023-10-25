import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'store';
import { toFixedDecimals } from 'utils/balance';
import { NO_INPUT } from 'utils/style';

import InputTransparent from 'components/InputTransparent';
import Input from './Input';

type Props = {
  handleAmountChange: (value: number | string) => void;
  value: string;
  disabled?: boolean;
};
function AmountInput(props: Props) {
  const amountEl = useRef(null);
  const {
    showValidationState: showErrors,
    validations,
    token,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);

  function handleAmountChange(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | undefined,
  ) {
    let value = e!.target.value;
    const index = value.indexOf('.');
    if (index > 0 && value.length - index - 8 > 0) {
      value = toFixedDecimals(value, 8);
    }

    props.handleAmountChange(value);
  }

  const focus = () => {
    if (amountEl.current) {
      (amountEl.current as any).focus();
    }
  };

  return (
    <Input
      label="Amount"
      error={!!(showErrors && validations.amount)}
      editable
      onClick={focus}
      cursor="text"
    >
      {token ? (
        <InputTransparent
          inputRef={amountEl}
          placeholder="0.00"
          type="number"
          min={0}
          step={0.1}
          onChange={handleAmountChange}
          disabled={isTransactionInProgress || props.disabled}
          value={props.value}
        />
      ) : (
        <div>{NO_INPUT}</div>
      )}
    </Input>
  );
}

export default AmountInput;
