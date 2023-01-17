import { makeStyles, createStyles } from '@mui/styles';
import React from 'react';
import CloseIcon from '../icons/close.svg';
import { Theme } from '@mui/material';

type StyleProps = {
  width?: number;
};

const useStyles = makeStyles<Theme, StyleProps>((theme) =>
  createStyles({
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
  }),
);

type Props = {
  children: JSX.Element | JSX.Element[];
  width?: number;
  closable?: boolean;
};

function Modal({ width, closable, children }: Props) {
  const classes = useStyles({ width });
  return (
    <div className={classes.overlay}>
      <div className={classes.modalContainer}>
        <div className={classes.modal}>
          {closable && (
            <img src={CloseIcon} className={classes.close} alt="close" />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
