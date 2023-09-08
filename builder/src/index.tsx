import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
const theme = responsiveFontSizes(
  createTheme({
    palette: { mode: "dark" },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
    },
  })
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
