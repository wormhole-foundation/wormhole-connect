import React, { ComponentProps, useCallback, useState } from 'react';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { IconButton } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { Scanner } from '@yudiel/react-qr-scanner';
import Modal from 'components/Modal';

const SCANNER_HEIGHT_PX = 500;

const useStyles = makeStyles()(() => ({
  scannerContainer: {
    minHeight: `${SCANNER_HEIGHT_PX}px`,
  },
}));

const formats: ComponentProps<typeof Scanner>['formats'] = [
  'qr_code',
  'rm_qr_code',
  'micro_qr_code',
];

interface QRScannerProps {
  onScan: (code: string) => void;
}

function QRScanner({ onScan }: QRScannerProps) {
  const { classes } = useStyles();
  const [open, setOpen] = useState<boolean>(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleScan: ComponentProps<typeof Scanner>['onScan'] = useCallback(
    (event) => {
      const code = event?.[0]?.rawValue;
      if (!code || typeof code !== 'string') return;
      onScan(code);
      handleClose();
    },
    [onScan],
  );

  return (
    <>
      <IconButton>
        <QrCodeIcon onClick={handleOpen} />
      </IconButton>
      {!!open && (
        <Modal
          open={true}
          closable={true}
          onClose={handleClose}
          width={SCANNER_HEIGHT_PX}
        >
          <div className={classes.scannerContainer}>
            <Scanner
              onScan={handleScan}
              allowMultiple={false}
              formats={formats}
              components={{ audio: false }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}

export default QRScanner;
