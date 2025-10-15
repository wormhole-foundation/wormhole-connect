import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { SxProps, Theme } from '@mui/material';
import React from 'react';

export interface ChevronToggleProps {
  expanded: boolean;
  onToggle: () => void;
  sx?: SxProps<Theme>;
}

export default function ChevronToggle({
  expanded,
  onToggle,
  sx,
}: ChevronToggleProps) {
  return expanded ? (
    <ExpandLessIcon
      sx={{
        cursor: 'pointer',
        width: 18,
        height: 18,
        marginLeft: '4px',
        ...sx,
      }}
      onClick={onToggle}
    />
  ) : (
    <ExpandMoreIcon
      sx={{
        cursor: 'pointer',
        width: 18,
        height: 18,
        marginLeft: '4px',
        ...sx,
      }}
      onClick={onToggle}
    />
  );
}
