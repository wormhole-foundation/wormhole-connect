import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setAmount } from '../../../store/transfer';
import { validate } from '../../../utils/transferValidation';

import InputTransparent from '../../../components/InputTransparent';
import Input from './Input';

function AmountInput() {
  const dispatch = useDispatch();
  const {
    validate: showErrors,
    validations,
    token,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transfer);

  function handleAmountChange(event) {
    const newAmount = Number.parseFloat(event.target.value);
    dispatch(setAmount(newAmount));
  }
  const validateAmount = () => validate(dispatch);

  return (
    <Input label="Amount" error={!!(showErrors && validations.amount)} editable>
      {token ? (
        <InputTransparent
          placeholder="0.00"
          type="number"
          min={0}
          step={0.1}
          onChange={handleAmountChange}
          onPause={validateAmount}
          disabled={isTransactionInProgress}
        />
      ) : (
        <div>-</div>
      )}
    </Input>
  );
}

export default AmountInput;
