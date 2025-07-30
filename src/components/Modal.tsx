import type { JSX } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Dialog, ScopedCssBaseline, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from 'icons/Close';

type Props = {
  open: boolean;
  children: JSX.Element | JSX.Element[];
  width: number;
  onClose: () => any;
  closable?: boolean;
};

function Modal({ open, width, closable, children, onClose }: Props) {
  const theme = useTheme();

  const styles = useMemo(
    () => ({
      dialog: {
        zIndex: 10,
      },
      container: {
        position: 'relative' as const,
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
        textAlign: 'center' as const,
        position: 'relative' as const,
        [theme.breakpoints.down('sm')]: {
          margin: '20px auto',
          padding: '24px 12px',
        },
        maxHeight: 'calc( 100vh - 80px )',
      },
      close: {
        position: 'absolute' as const,
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
        background: theme.palette.input.background,
      },
    }),
    [theme, width],
  );

  const handleClickInModal = useCallback((event: any) => {
    event.stopPropagation();
  }, []);

  useEffect(() => {
    const callback = (e: any) => {
      if (e.keyCode === 27 || e.which === 27) onClose();
    };

    document.addEventListener('keyup', callback);

    return () => {
      document.removeEventListener('keyup', callback);
    };
  }, [onClose]);

  return (
    <Dialog
      open={open}
      sx={{ borderRadius: 8, ...styles.dialog }}
      fullWidth
      fullScreen
    >
      <ScopedCssBaseline enableColorScheme>
        <Box sx={styles.container} onClick={onClose}>
          {closable && (
            <CloseIcon
              sx={{ fontSize: 32, ...styles.close }}
              onClick={onClose}
            />
          )}
          <Box sx={styles.modal} onClick={handleClickInModal}>
            {children}
          </Box>
        </Box>
      </ScopedCssBaseline>
    </Dialog>
  );
}

export default Modal;
