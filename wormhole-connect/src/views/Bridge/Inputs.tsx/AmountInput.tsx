import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setAmount } from '../../../store/transfer';
import { validate } from '../../../utils/transferValidation';

import InputTransparent from '../../../components/InputTransparent';
import Input from './Input';
import { toFixedDecimals } from '../../../utils/balance';

function AmountInput() {
  const dispatch = useDispatch();
  const amountEl = useRef(null);
  const {
    validate: showErrors,
    validations,
    token,
    isTransactionInProgress,
    amount,
  } = useSelector((state: RootState) => state.transfer);
  const [value, setValue] = useState(amount ? `${amount}` : '');

  function handleAmountChange(event) {
    let value = event.target.value;
    const index = value.indexOf('.');
    switch (true) {
      case index === -1: {
        value = Number.parseInt(event.target.value);
        break;
      }
      case index === 0: {
        value = '0.';
        break;
      }
      case index >= 0 && index < value.length - 1: {
        value = toFixedDecimals(value, 8);
        break;
      }
      default: {
        break;
      }
    }

    setValue(value);
    dispatch(setAmount(Number.parseFloat(value)));
  }
  const validateAmount = () => validate(dispatch);

  useEffect(() => {
    setValue(amount ? `${amount}` : '');
  }, [amount]);

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
    >
      {token ? (
        <InputTransparent
          inputRef={amountEl}
          placeholder="0.00"
          type="number"
          min={0}
          step={0.1}
          onChange={handleAmountChange}
          onPause={validateAmount}
          disabled={isTransactionInProgress}
          value={value}
        />
      ) : (
        <div>-</div>
      )}
    </Input>
  );
}

export default AmountInput;
