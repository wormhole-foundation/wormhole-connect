import { makeStyles } from 'tss-react/mui';
import React from 'react';
import { Dialog } from '@mui/material';
// import { useTheme } from '@mui/material/styles';
// import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '../icons/Close';

// type StyleProps = { align: Alignment };
// const useStyles = makeStyles<StyleProps>()((theme, { align }) => ({
const useStyles = makeStyles<{ width: number }>()((theme, { width }) => ({
  container: {
    position: 'relative',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
  },
  modal: {
    width: '100%',
    maxWidth: `${width}px`,
    margin: '40px auto',
    padding: '24px',
    textAlign: 'center',
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      margin: '20px auto',
      padding: '24px 12px',
    },
  },
  close: {
    position: 'absolute',
    top: '28px',
    right: '28px',
    cursor: 'pointer',
    opacity: '70%',
    zIndex: '10',
    [theme.breakpoints.down('sm')]: {
      top: '12px',
      right: '20px',
    },
  },
  background: {
    background: theme.palette.modal.background,
  },
}));

type Props = {
  open: boolean;
  children: JSX.Element | JSX.Element[];
  width: number;
  onClose: () => any;
  closable?: boolean;
};

function Modal({ open, width, closable, children, onClose }: Props) {
  const { classes } = useStyles({ width });
  // TODO: have user pass in full-screen param?
  // const theme = useTheme();
  // const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{ borderRadius: 8 }}
      fullWidth
      fullScreen
      // maxWidth={width}
      // fullScreen={fullScreen}
    >
      <div className={classes.container}>
        {closable && (
          <CloseIcon
            sx={{ fontSize: 32 }}
            className={classes.close}
            onClick={onClose}
          />
        )}
        <div className={classes.modal}>{children}</div>
      </div>
    </Dialog>
  );
}

export default Modal;
