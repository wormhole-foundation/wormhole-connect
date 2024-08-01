import React, { useState } from 'react';
import { ContentPaste } from '@mui/icons-material';
import {
  FormGroup,
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Button,
} from '@mui/material';
import QRScanner from './QRScanner';

interface ManualAddressInputProps {
  handleManualConnect: (address: string) => void;
}

export const ManualAddressInput = (props: ManualAddressInputProps) => {
  const [address, setAddress] = useState('');

  const handlePaste = async () =>
    setAddress(await navigator.clipboard.readText());

  const handleSetAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  const handleManualConnect = () => {
    props.handleManualConnect(address);
  };

  return (
    <FormGroup>
      <Box display="flex" flexDirection="column" gap={1}>
        <FormControl variant="outlined">
          <InputLabel htmlFor="outlined-adornment-password">
            Wallet Address
          </InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            fullWidth
            placeholder="0x..."
            onChange={handleSetAddress}
            value={address}
            endAdornment={
              <InputAdornment position="end">
                <QRScanner onScan={setAddress} />
                <IconButton>
                  <ContentPaste onClick={handlePaste} />
                </IconButton>
              </InputAdornment>
            }
            label="Wallet Address"
          />
        </FormControl>
        <Button onClick={handleManualConnect}>CONNECT</Button>
      </Box>
    </FormGroup>
  );
};
