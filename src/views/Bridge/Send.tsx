import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '../../components/Button';
import { setRoute } from '../../store/router';
import { sendTransfer } from '../../store/transfer';

function Send() {
  const dispatch = useDispatch();
  const send = async () => {
    await dispatch(sendTransfer());
    // dispatch(setRoute('redeem'));
  };
  return (
    <Button
      onClick={send}
      text="Approve and proceed with transaction"
      action
      elevated
    />
  );
}

export default Send;
