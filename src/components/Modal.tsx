import { makeStyles } from '@mui/styles';
import React from 'react';
import CloseIcon from '../icons/close.svg';
import { Theme } from '@mui/material';

const useStyles = makeStyles((theme: Theme) => ({
  overlay: {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContainer: {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: theme.palette.primary[800],
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    position: 'relative',
  },
  close: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
}));

type Props = {
  children: JSX.Element | JSX.Element[];
  closable?: boolean;
};

function Modal(props: Props) {
  const classes = useStyles();
  return (
    <div className={classes.overlay}>
      <div className={classes.modalContainer}>
        <div className={classes.modal}>
          {props.closable && (
            <img src={CloseIcon} className={classes.close} alt="close" />
          )}
          {props.children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
