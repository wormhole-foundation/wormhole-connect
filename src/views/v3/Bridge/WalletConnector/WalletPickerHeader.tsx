import React from 'react';
import { DialogTitle, useTheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface WalletPickerHeaderProps {
  onClose: () => void;
  title: React.ReactNode;
}

function WalletPickerHeader({ onClose, title }: WalletPickerHeaderProps) {
  const theme: any = useTheme();

  const styles = {
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    title: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButton: {
      position: 'absolute',
      backgroundColor: theme.palette.formContainer.background,
      border: '1px solid ' + theme.palette.input.border,
      '&:hover': { backgroundColor: theme.palette.formContainer.background },
      height: '32px',
      width: '32px',
      fontSize: '16px',
      right: '16px',
    },
  };

  return (
    <DialogTitle sx={styles.header}>
      <Typography sx={styles.title} role="heading" aria-level={2}>
        {title}
      </Typography>
      <IconButton
        sx={styles.iconButton}
        onClick={onClose}
        aria-label="Close wallet picker"
      >
        <CloseRoundedIcon fontSize="inherit" />
      </IconButton>
    </DialogTitle>
  );
}

export default React.memo(WalletPickerHeader);
