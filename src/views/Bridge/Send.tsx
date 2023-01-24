import React from 'react';
import Button from '../../components/Button';
import { sendTransfer } from '../../utils/sdk';

function Send() {
  async function send() {
    await sendTransfer();
    console.log('sent');
    // await dispatch(sendTransfer());
    // dispatch(setRoute('redeem'));
  }
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
