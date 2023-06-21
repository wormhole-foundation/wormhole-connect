import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setAmount } from '../../../store/transferInput';
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
  } = useSelector((state: RootState) => state.transferInput);
  const [value, setValue] = useState(amount ? `${amount}` : '');

  function handleAmountChange(event) {
    const newAmount = Number.parseFloat(event.target.value);
    setValue(event.target.value);
    dispatch(setAmount(newAmount));
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
