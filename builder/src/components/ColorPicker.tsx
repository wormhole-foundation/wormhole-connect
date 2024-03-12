import { Box, Button, ClickAwayListener, Tooltip } from "@mui/material";
import { CustomTheme } from "@wormhole-foundation/wormhole-connect";
import { useCallback, useMemo, useState } from "react";
import {
  Color,
  ColorChangeHandler,
  ColorResult,
  SketchPicker,
} from "react-color";
import { getObjectPath, setObjectPathImmutable } from "../utils";

const colorToString = (color: ColorResult) =>
  color.rgb.a === undefined
    ? color.hex
    : `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
const stringToColor = (color: string): Color => {
  if (color.startsWith("rgba(")) {
    const [r, g, b, a] = color.slice(5, color.length - 1).split(",");
    return { r: parseInt(r), g: parseInt(g), b: parseInt(b), a: parseFloat(a) };
  }
  return color;
};

function ColorPickerContent({
  color,
  onChange,
}: {
  color: Color;
  onChange: ColorChangeHandler;
}) {
  return <SketchPicker color={color} onChange={onChange} />;
}

export default function ColorPicker({
  customTheme,
  setCustomTheme,
  path,
  defaultTheme,
}: {
  customTheme: CustomTheme | undefined;
  setCustomTheme: React.Dispatch<React.SetStateAction<CustomTheme | undefined>>;
  path: string;
  defaultTheme: CustomTheme;
}) {
  const color = useMemo(
    () =>
      getObjectPath(customTheme, path) ||
      getObjectPath(defaultTheme, path) ||
      "#ffffff",
    [customTheme, path, defaultTheme]
  );
  const handleColorChange = useCallback(
    (color: ColorResult, event: any) => {
      setCustomTheme((prev) =>
        setObjectPathImmutable(prev || defaultTheme, path, colorToString(color))
      );
    },
    [setCustomTheme, path, defaultTheme]
  );
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);
  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Tooltip
          PopperProps={{
            disablePortal: true,
            sx: {
              "& .MuiTooltip-tooltip": { padding: 0 },
              "& .MuiTooltip-arrow": { color: "#ffffff" },
            },
          }}
          onClose={handleClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          arrow
          title={
            <ColorPickerContent
              color={stringToColor(color)}
              onChange={handleColorChange}
            />
          }
        >
          <Button
            onClick={handleOpen}
            variant="contained"
            color="inherit"
            sx={{ padding: 0.5, minWidth: 0 }}
          >
            <Box
              sx={{
                height: 14,
                width: 36,
                backgroundColor: color,
              }}
            />
          </Button>
        </Tooltip>
      </div>
    </ClickAwayListener>
  );
}
