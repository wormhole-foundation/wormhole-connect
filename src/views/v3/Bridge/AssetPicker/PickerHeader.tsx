import React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
interface AssetPickerHeaderProps {
  onClose: () => void;
  showSearch?: boolean;
  onBack?: () => void;
}

function AssetPickerHeader({
  onClose,
  showSearch = false,
  onBack,
}: AssetPickerHeaderProps) {
  const theme: any = useTheme();

  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      padding: '16px',
      paddingBottom: '8px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButton: {
      padding: 0,
      position: 'absolute',
      backgroundColor: theme.palette.background.form,
      border: '1px solid ' + theme.palette.input.border,
      '&:hover': { backgroundColor: theme.palette.background.form },
    },
    icon: {
      height: '16px',
      width: '16px',
      padding: '8px',
    },
  };

  return (
    <>
      <Box sx={styles.header}>
        {showSearch && onBack && (
          <IconButton
            sx={{
              ...styles.iconButton,
              left: '16px',
            }}
            onClick={onBack}
            aria-label="Go back"
            data-testid="back-button"
          >
            <ArrowBackRoundedIcon sx={styles.icon} />
          </IconButton>
        )}
        <Typography sx={styles.title} role="heading" aria-level={2}>
          Select token
        </Typography>
        <IconButton
          sx={{
            ...styles.iconButton,
            right: '16px',
          }}
          onClick={onClose}
          aria-label="Close routes"
          data-testid="routes-close-button"
        >
          <CloseRoundedIcon sx={styles.icon} />
        </IconButton>
      </Box>
    </>
  );
}

export default React.memo(AssetPickerHeader);
