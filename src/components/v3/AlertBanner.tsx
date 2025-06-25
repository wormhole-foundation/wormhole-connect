import React, { useMemo, type ReactNode } from 'react';
import {
  Box,
  Collapse,
  Typography,
  useTheme,
  type SxProps,
} from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

interface AlertBannerProps {
  show: boolean;
  content: ReactNode;
  warning?: boolean;
  error?: boolean;
  testId?: string;
  color?: string;
  sx?: SxProps;
  className?: string;
}

/**
 * AlertBanner component for displaying contextual messages with appropriate styling
 *
 * @param props - The props for the AlertBanner component
 * @returns A styled alert banner with optional warning/error styling
 */
const AlertBanner: React.FC<AlertBannerProps> = ({
  show,
  content,
  warning = false,
  error = false,
  testId,
  color,
  sx,
  className,
}) => {
  const theme = useTheme();

  // Determine the appropriate color based on props
  const alertColor = useMemo((): string | undefined => {
    if (color) return color;
    if (warning) return theme.palette.warning.main;
    if (error) return theme.palette.error.main;
    return undefined;
  }, [
    color,
    error,
    warning,
    theme.palette.warning.main,
    theme.palette.error.main,
  ]);

  // Early return if content is not provided or empty
  if (!content) {
    return null;
  }

  return (
    <Collapse
      className={className}
      sx={sx}
      in={show}
      unmountOnExit
      timeout="auto"
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: '8px',
        }}
        data-testid={testId}
        role="alert"
        aria-live="polite"
      >
        <ReportProblemOutlinedIcon
          fontSize="small"
          htmlColor={alertColor}
          aria-hidden="true"
        />
        <Typography
          color={alertColor}
          fontSize="14px"
          fontWeight={700}
          component="div"
        >
          {content}
        </Typography>
      </Box>
    </Collapse>
  );
};

export default AlertBanner;
