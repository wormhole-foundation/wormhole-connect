// import { makeStyles, createStyles } from '@mui/styles';
import { makeStyles } from 'tss-react/mui';
import React from 'react';
import CloseIcon from '../icons/close.svg';
// import { Theme } from '@mui/material';

type StyleProps = {
  width: string;
};

const useStyles = makeStyles<StyleProps>()((theme, { width }) => ({
  overlay: {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: '500',
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
    maxWidth: width,
    margin: '20px',
    backgroundColor: theme.palette.primary[800],
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    position: 'relative',
  },
  close: {
    position: 'absolute',
    top: '28px',
    right: '24px',
    cursor: 'pointer',
  },
}));

type Props = {
  children: JSX.Element | JSX.Element[];
  width: string;
  closable?: boolean;
};

function Modal({ width, closable, children }: Props) {
  const { classes } = useStyles({ width });

  // dispatch close event
  const event = new Event('close');
  const emitClose = () => document.dispatchEvent(event);

  return (
    <div className={classes.overlay}>
      <div className={classes.modalContainer}>
        <div className={classes.modal}>
          {closable && (
            <img
              src={CloseIcon}
              className={classes.close}
              alt="close"
              onClick={emitClose}
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
