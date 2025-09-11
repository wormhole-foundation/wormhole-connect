import React, { type ReactNode } from 'react';
import { Box, Typography, useTheme, type SxProps } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

interface AlertBannerProps {
  children?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  warning?: boolean;
  error?: boolean;
  testId?: string;
  color?: string;
  sx?: SxProps;
  className?: string;
}

function AlertBanner({
  children,
  title,
  description,
  warning = false,
  error = false,
  testId,
  color,
  sx,
  className,
}: AlertBannerProps) {
  const theme = useTheme();

  // Determine the appropriate color based on props
  const alertColor =
    color ||
    (warning && theme.palette.warning.main) ||
    (error && theme.palette.error.main) ||
    undefined;

  // Determine if we have structured content
  const hasStructuredContent = title !== undefined && description !== undefined;

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: '8px',
        ...sx,
      }}
      data-testid={testId}
      role="alert"
      aria-live="polite"
    >
      <WarningAmberRoundedIcon
        fontSize="small"
        htmlColor={alertColor}
        aria-hidden="true"
      />
      {hasStructuredContent ? (
        <Box>
          <Typography color={alertColor} fontSize="14px" fontWeight={700}>
            {title}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize="14px">
            {description}
          </Typography>
        </Box>
      ) : (
        <Typography
          color={alertColor}
          fontSize="14px"
          fontWeight={700}
          component="div"
        >
          {children || title}
        </Typography>
      )}
    </Box>
  );
}

export default AlertBanner;
