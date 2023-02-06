import { makeStyles } from 'tss-react/mui';
import React from 'react';
import { Dialog } from '@mui/material';
// import { useTheme } from '@mui/material/styles';
// import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '../icons/components/Close';

// type StyleProps = { align: Alignment };
// const useStyles = makeStyles<StyleProps>()((theme, { align }) => ({
const useStyles = makeStyles<{ width: number }>()((theme, { width }) => ({
  modal: {
    width: '100%',
    maxWidth: `${width}px`,
    margin: '40px auto',
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
  background: {
    background: theme.palette.modal.background
  }
}));

type Props = {
  open: boolean;
  children: JSX.Element | JSX.Element[];
  width: number;
  closable?: boolean;
};

function Modal({ open, width, closable, children }: Props) {
  const { classes } = useStyles({ width });
  // TODO: have user pass in full-screen param?
  // const theme = useTheme();
  // const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // dispatch close event
  const event = new Event('close');
  const emitClose = () => document.dispatchEvent(event);

  return (
    <Dialog
      open={open}
      onClose={emitClose}
      sx={{ borderRadius: 8 }}
      fullWidth
      fullScreen
      // maxWidth={width}
      // fullScreen={fullScreen}
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
