import { makeStyles } from 'tss-react/mui';
import React from 'react';
import CloseIcon from '../icons/components/Close';
import { Breakpoint, Dialog } from '@mui/material';

const useStyles = makeStyles()((theme) => ({
  modal: {
    width: '100%',
    backgroundColor: theme.palette.card.background,
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
  open: boolean;
  children: JSX.Element | JSX.Element[];
  width: Breakpoint;
  closable?: boolean;
};

function Modal({ open, width, closable, children }: Props) {
  const { classes } = useStyles();

  // dispatch close event
  const event = new Event('close');
  const emitClose = () => document.dispatchEvent(event);

  return (
    <Dialog
      open={open}
      onClose={emitClose}
      sx={{ borderRadius: 8 }}
      maxWidth={width}
      fullWidth
    >
      <div className={classes.modal}>
        {closable && (
          <CloseIcon
            sx={{ fontSize: 32 }}
            className={classes.close}
            onClick={emitClose}
          />
        )}
        {children}
      </div>
    </Dialog>
  );
}

export default Modal;
