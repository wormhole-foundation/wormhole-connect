import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '../../components/Button';
import { setRoute } from '../../store/router';

function Send() {
  const dispatch = useDispatch();
  const send = () => {
    dispatch(setRoute('redeem'));
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
