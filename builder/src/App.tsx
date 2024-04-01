import {
  ContentCopy,
  EditOutlined,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Launch,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import WormholeConnect, {
  ChainName,
  WormholeConnectConfig,
  dark,
  MAINNET,
  TESTNET,
} from "@wormhole-foundation/wormhole-connect";
import type { WormholeConnectPartialTheme } from "@wormhole-foundation/wormhole-connect";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import Background from "./Background";
import ColorPicker from "./components/ColorPicker";
import RouteCard from "./components/RouteCard";
import ErrorBoundary from "./components/ErrorBoundary";
import { ROUTE_INFOS } from "./consts";
import {
  copyTextToClipboard,
  getObjectPath,
  setObjectPathImmutable,
} from "./utils";

export type Rpcs = {
  [chain in ChainName]?: string;
};

// test

const MAINNET_TOKENS = Object.keys(MAINNET.tokens);
const TESTNET_TOKENS = Object.keys(TESTNET.tokens);
const VERSION = "0.3.3";
// generated with https://www.srihash.org/
const SCRIPT_INTEGRITY_HASH =
  "sha384-QOTWWlgPEcpWnzakQRaUW71dYatQWsRJYtCjz+y94hwZxjxg9jU7X+sE6pDmo6Ao";
const STYLESHEET_INTEGRITY_HASH =
  "sha384-BTkX2AhTeIfxDRFsJbLtR26TQ9QKKpi7EMe807JdfQQBTAkUT9a2mSGwf/5CJ4bF";

// registerRpcProvider throws on invalid RPCs
const isValidRpc = (rpc?: string) =>
  rpc &&
  (rpc.startsWith("http://") ||
    rpc.startsWith("https://") ||
    rpc.startsWith("ws://") ||
    rpc.startsWith("wss://"));

const StepCard = ({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) => (
  <Card
    sx={{
      backgroundColor: "rgba(255,255,255,0.01)",
      minHeight: "100%",
      p: 2,
      mx: 2,
      display: "flex",
    }}
  >
    <Box sx={{ mr: 1, mt: 0.25 }}>
      <Avatar
        sx={{
          backgroundColor: "rgba(100,100,100,.5)",
          color: "inherit",
          height: 28,
          width: 28,
        }}
      >
        <Typography>{number}</Typography>
      </Avatar>
    </Box>
    <Box>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography>{description}</Typography>
    </Box>
  </Card>
);

const ScreenButton = ({
  text,
  number,
  setScreen,
  optional = false,
  disabled,
}: {
  text: string;
  number: number;
  setScreen: React.Dispatch<React.SetStateAction<number>>;
  optional?: boolean;
  disabled?: boolean;
}) => {
  const handleClick = useCallback(() => {
    setScreen(number);
  }, [setScreen, number]);
  return (
    <Button
      color="inherit"
      variant="contained"
      sx={{
        backgroundColor: "rgba(255,255,255,0.1)",
        py: 2,
        mb: 2,
        "& .MuiButton-endIcon": { ml: "auto" },
      }}
      endIcon={<KeyboardArrowRight />}
      fullWidth
      onClick={handleClick}
      disabled={disabled}
    >
      {text}{" "}
      {optional ? (
        <Chip
          size="small"
          label="Optional"
          sx={{ ml: 1, backgroundColor: "#FFC74919", color: "#FFC749" }}
        />
      ) : null}
    </Button>
  );
};

const customized = dark;
customized.background.default = "transparent";
const defaultThemeJSON = JSON.stringify(customized, undefined, 2);

function App() {
  const persistDrawer = useMediaQuery("(min-width:1400px)");
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);
  const [screen, setScreen] = useState<number>(0);
  const backScreen = useCallback(() => {
    setScreen(0);
  }, []);
  // TODO: should probably move all of this config state to a reducer so we can switch multiple pieces out with one action
  // https://react.dev/reference/react/useReducer
  // BEGIN STYLING
  const [_pageHeader, setPageHeader] = useState<string | undefined>(undefined);
  const handlePageHeaderChange = useCallback((e: any) => {
    setPageHeader(e.target.value || undefined);
  }, []);
  const [pageHeader] = useDebounce(_pageHeader, 500);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState<
    boolean | undefined
  >(undefined);
  const handleToggleShowHamburgerMenu = useCallback((e: any) => {
    setShowHamburgerMenu((prev) => !(prev === undefined || prev));
  }, []);
  // END STYLING
  // BEGIN THEME
  const [mode, setMode] = useState<"dark" | "light" | undefined>("dark");
  const [fontHref, setFontHref] = useState<string>("");
  const handleFontURLChange = useCallback((e: any) => {
    setFontHref(e.target.value);
  }, []);
  const [debouncedFontHref] = useDebounce(fontHref, 500);
  useEffect(() => {
    if (debouncedFontHref) {
      const link = document.createElement("link");
      link.href = debouncedFontHref;
      link.rel = "stylesheet";
      document.head.appendChild(link);
      return () => {
        link.remove();
      };
    }
  }, [debouncedFontHref]);
  const [customTheme, setCustomTheme] = useState<
    WormholeConnectPartialTheme | undefined
  >(undefined);
  const [customThemeText, setCustomThemeText] = useState(defaultThemeJSON);
  // const [customThemeError, setCustomThemeError] = useState<boolean>(false);
  const handleModeChange = useCallback(
    (e: any, value: string) => {
      if (value === "dark" || value === "light") {
        setMode(value);
        setCustomTheme({ mode: value });
      } else {
        setMode(undefined);
        try {
          setCustomTheme(JSON.parse(customThemeText));
        } catch (e) {}
      }
    },
    [customThemeText]
  );
  // const handleThemeChange = useCallback((e: any) => {
  //   try {
  //     const str = e.target.value;
  //     setCustomThemeText(str);
  //     setCustomTheme(JSON.parse(str));
  //     setCustomThemeError(false);
  //   } catch (e) {
  //     setCustomThemeError(true);
  //   }
  // }, []);
  const handleFontChange = useCallback((e: any) => {
    setCustomTheme((prevState) =>
      setObjectPathImmutable(
        prevState || customized,
        `font.${e.target.name}`,
        e.target.value
      )
    );
  }, []);
  // END THEME
  // BEGIN ROUTES
  const [_routes, setRoutes] = useState<string[] | undefined>(undefined);
  const [routes] = useDebounce(_routes, 1000);
  const handleClearRoutes = useCallback(() => {
    setRoutes(undefined);
  }, []);
  const handleNoneRoutes = useCallback(() => {
    setRoutes([]);
  }, []);
  // END ROUTES
  // BEGIN ENV
  const [env, setEnv] = useState<"testnet" | "mainnet">("mainnet");
  const [selectedChains, setSelectedChains] = useState<ChainName[] | undefined>(
    undefined
  );
  const [_tokens, setTokens] = useState<string[] | undefined>(undefined);
  const [tokens] = useDebounce(_tokens, 1000);
  const [defaultFromNetwork, setDefaultFromNetwork] = useState<
    ChainName | undefined
  >(undefined);
  const handleDefaultFromNetworkChange = useCallback((e: any) => {
    e.target.value
      ? setDefaultFromNetwork(e.target.value)
      : setDefaultFromNetwork(undefined);
  }, []);
  const [defaultToNetwork, setDefaultToNetwork] = useState<
    ChainName | undefined
  >(undefined);
  const handleDefaultToNetworkChange = useCallback((e: any) => {
    e.target.value
      ? setDefaultToNetwork(e.target.value)
      : setDefaultToNetwork(undefined);
  }, []);
  const [defaultToken, setDefaultToken] = useState<string | undefined>(
    undefined
  );
  const [hideConnect, setHideConnect] = useState<boolean>(false);
  const handleDefaultTokenChange = useCallback((e: any) => {
    e.target.value
      ? setDefaultToken(e.target.value)
      : setDefaultToken(undefined);
  }, []);
  const [requiredNetwork, setRequiredNetwork] = useState<ChainName | undefined>(
    undefined
  );
  const handleRequiredNetworkChange = useCallback((e: any) => {
    e.target.value
      ? setRequiredNetwork(e.target.value)
      : setRequiredNetwork(undefined);
  }, []);
  // networks and tokens handlers come after defaults so they can appropriately reset them
  const handleClearNetworks = useCallback(() => {
    setSelectedChains(undefined);
  }, []);
  const handleNoneNetworks = useCallback(() => {
    // clear defaults to avoid bugs (could be smarter)
    setDefaultFromNetwork(undefined);
    setDefaultToNetwork(undefined);
    setRequiredNetwork(undefined);
    setSelectedChains([]);
  }, []);
  const handleNetworksChange = useCallback((e: any) => {
    // clear defaults to avoid bugs (could be smarter)
    setDefaultFromNetwork(undefined);
    setDefaultToNetwork(undefined);
    setRequiredNetwork(undefined);
    setSelectedChains(
      typeof e.target.value === "string"
        ? e.target.value
            .split(",")
            .map((v: string) => parseInt(v))
            .sort((a: number, b: number) => a - b)
        : e.target.value.sort((a: number, b: number) => a - b)
    );
  }, []);
  const handleClearTokens = useCallback(() => {
    setTokens(undefined);
  }, []);
  const handleNoneTokens = useCallback(() => {
    // clear defaults to avoid bugs (could be smarter)
    setDefaultToken(undefined);
    setTokens([]);
  }, []);
  const handleTokensChange = useCallback((e: any) => {
    // clear defaults to avoid bugs (could be smarter)
    setDefaultToken(undefined);
    setTokens(
      typeof e.target.value === "string"
        ? e.target.value.split(",").sort()
        : e.target.value.sort()
    );
  }, []);
  const [_rpcs, setRpcs] = useState<Rpcs | undefined>(undefined);
  const rpcs = useMemo(() => {
    let valid: Rpcs = {};
    for (let key in _rpcs) {
      let cn = key as ChainName;
      if (isValidRpc(_rpcs[cn])) {
        valid[cn] = _rpcs[cn];
      }
    }
    if (Object.keys(valid).length === 0) return undefined;
    return valid;
  }, [_rpcs]);

  const handleRpcChange = useCallback((e: any) => {
    setRpcs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }, []);
  const [rpcsOpen, setRpcsOpen] = useState<boolean>(false);
  const handleRpcsOpen = useCallback(() => {
    setRpcsOpen(true);
  }, []);
  const handleRpcsClose = useCallback(() => {
    setRpcsOpen(false);
  }, []);
  const handleEnvChange = useCallback((e: any, value: string) => {
    if (value === "testnet" || value === "mainnet") {
      setTokens(undefined);
      setSelectedChains(undefined);
      setDefaultFromNetwork(undefined);
      setDefaultToNetwork(undefined);
      setDefaultToken(undefined);
      setRequiredNetwork(undefined);

      // These timeouts are necessary because the config
      // is used to reset the transferInput redux store
      // and if we change the network before that can happen
      // we get all kinds of fun errors
      setTimeout(() => {
        setHideConnect(true);

        setTimeout(() => {
          setEnv(value);

          setTimeout(() => {
            setHideConnect(false);
          }, 50);
        }, 50);
      }, 50);
    }
  }, []);

  const chains = env === "mainnet" ? MAINNET.chains : TESTNET.chains;

  // END ENV
  // START BRIDGE COMPLETE
  const [_ctaText, setCtaText] = useState<string>("");
  const [ctaText] = useDebounce(_ctaText, 1000);
  const handleCtaTextChange = useCallback((e: any) => {
    setCtaText(e.target.value);
  }, []);
  const [_ctaLink, setCtaLink] = useState<string>("");
  const [ctaLink] = useDebounce(_ctaLink, 1000);
  const handleCtaLinkChange = useCallback((e: any) => {
    setCtaLink(e.target.value);
  }, []);
  // END BRIDGE COMPLETE
  const handleResetAll = useCallback(() => {
    setMode("dark");
    setCustomTheme(undefined);
    setCustomThemeText(defaultThemeJSON);
    // setCustomThemeError(false);
    setFontHref("");
    setDefaultFromNetwork(undefined);
    setDefaultToNetwork(undefined);
    setDefaultToken(undefined);
    setRequiredNetwork(undefined);
    setSelectedChains(undefined);
    setTokens(undefined);
    setRpcs(undefined);
    setEnv("testnet");
    setCtaText("");
    setCtaLink("");
    setPageHeader("");
    setRoutes(undefined);
  }, []);
  // START CODE
  const [codeType, setCodeType] = useState(0);
  const handleCodeTypeChange = useCallback(
    (event: React.SyntheticEvent, newValue: number) => {
      setCodeType(newValue);
    },
    []
  );
  // NOTE: the WormholeConnect component is keyed by the stringified version of config
  // because otherwise the component did not update on changes
  const config: WormholeConnectConfig = useMemo(
    () => ({
      env,
      rpcs,
      tokens, // always testnet for the builder
      cta:
        ctaText && ctaLink
          ? {
              text: ctaText,
              link: ctaLink,
            }
          : undefined,
      bridgeDefaults:
        defaultFromNetwork ||
        defaultToNetwork ||
        defaultToken ||
        requiredNetwork
          ? {
              fromNetwork: defaultFromNetwork,
              toNetwork: defaultToNetwork,
              token: defaultToken,
              requiredNetwork: requiredNetwork,
            }
          : undefined,
      routes,
      pageHeader,
      networks: selectedChains,
      showHamburgerMenu,
    }),
    [
      env,
      rpcs,
      tokens,
      selectedChains,
      ctaText,
      ctaLink,
      defaultFromNetwork,
      defaultToNetwork,
      defaultToken,
      requiredNetwork,
      routes,
      pageHeader,
      showHamburgerMenu,
    ]
  );

  const [htmlCode, jsxCode] = useMemo(() => {
    const configString = JSON.stringify(config);
    const themeStringHTML = customTheme
      ? ` data-theme='${JSON.stringify(customTheme)}'`
      : "";
    const themeStringJSX = customTheme
      ? ` theme={${JSON.stringify(customTheme)}}`
      : "";

    return [
      // Hosted version (CDN)
      `<div id="wormhole-connect" data-config='${configString}'${themeStringHTML} /></div>
<script type="module" src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@${VERSION}/dist/main.js" integrity="${SCRIPT_INTEGRITY_HASH}"></script>
<link rel="stylesheet" href="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@${VERSION}/dist/main.css" integrity="${STYLESHEET_INTEGRITY_HASH}"/>`,

      // React version
      `import WormholeConnect from '@wormhole-foundation/wormhole-connect';
function App() {
  return (
    <WormholeConnect config={${configString}}${themeStringJSX} />
  );
}`,
    ];
  }, [config, customTheme]);
  const [openCopySnack, setOpenCopySnack] = useState<boolean>(false);
  const handleCopySnackClose = useCallback(() => {
    setOpenCopySnack(false);
  }, []);
  const handleCopy = useCallback(() => {
    copyTextToClipboard(codeType === 0 ? htmlCode : jsxCode);
    setOpenCopySnack(true);
  }, [codeType, htmlCode, jsxCode]);
  // END CODE
  return (
    <Background>
      <Box position="fixed" right="-4px" top="88px">
        <Button
          variant="contained"
          color="inherit"
          startIcon={<KeyboardArrowLeft />}
          onClick={handleOpen}
        >
          Customize &amp; Deploy
        </Button>
      </Box>
      <Box display="flex">
        <Drawer
          variant={persistDrawer ? "persistent" : "temporary"}
          anchor="right"
          open={open}
          onClose={persistDrawer ? undefined : handleClose}
          sx={{
            width: persistDrawer && !open ? 0 : 600,
            maxWidth: "100vw",
            flexShrink: 0,
            order: 1,
            "& .MuiDrawer-paper": {
              backgroundColor: "#0F1024",
              backgroundImage: "none",
              borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
              width: 600,
              maxWidth: "100vw",
              boxSizing: "border-box",
              pt: 10,
              pb: 12,
            },
          }}
        >
          {screen === 0 ? (
            <>
              <Button
                color="inherit"
                endIcon={<KeyboardArrowRight />}
                onClick={handleClose}
                sx={{ mb: 1, justifyContent: "flex-start", pl: 2 }}
              >
                Hide
              </Button>
              <Box px={2}>
                <Typography variant="h5" component="h2" mt={1.5} mb={2}>
                  Customize
                </Typography>
                <ScreenButton
                  text="Styling"
                  number={1}
                  setScreen={setScreen}
                  optional
                />
                <ScreenButton text="Palette" number={2} setScreen={setScreen} />
                <ScreenButton text="Routes" number={3} setScreen={setScreen} />
                <ScreenButton
                  text="Networks & Assets"
                  number={4}
                  setScreen={setScreen}
                />
                <ScreenButton
                  text="Bridge Complete"
                  number={5}
                  optional
                  setScreen={setScreen}
                />
                <Typography variant="h5" component="h2" mt={1.5} mb={2}>
                  Deploy
                </Typography>
                <ScreenButton
                  text="Get Code"
                  number={6}
                  setScreen={setScreen}
                />
              </Box>
            </>
          ) : screen === 1 ? (
            <>
              <Button
                color="inherit"
                startIcon={<KeyboardArrowLeft />}
                onClick={backScreen}
                sx={{ mb: 1, justifyContent: "flex-start", pl: 2 }}
              >
                Styling
              </Button>
              <Box mx={2}>
                <TextField
                  label="Page Header"
                  fullWidth
                  value={_pageHeader || ""}
                  onChange={handlePageHeaderChange}
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box mx={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        showHamburgerMenu === undefined || showHamburgerMenu
                      }
                      onChange={handleToggleShowHamburgerMenu}
                    />
                  }
                  label="Show Hamburger Menu"
                />
              </Box>
            </>
          ) : screen === 2 ? (
            <>
              <Button
                color="inherit"
                startIcon={<KeyboardArrowLeft />}
                onClick={backScreen}
                sx={{ mb: 1, justifyContent: "flex-start", pl: 2 }}
              >
                Palette
              </Button>
              <Box mx={2}>
                <Typography variant="h5" component="h2" mt={1.5} mb={2}>
                  Theme
                </Typography>
                <RadioGroup
                  row
                  value={mode || "custom"}
                  onChange={handleModeChange}
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel
                    value="dark"
                    control={<Radio />}
                    label="Dark"
                  />
                  <FormControlLabel
                    value="light"
                    control={<Radio />}
                    label="Light"
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label="Custom"
                  />
                </RadioGroup>
                {mode === undefined ? (
                  <>
                    <Typography variant="h5" component="h2" mt={1.5} mb={2}>
                      Backgrounds
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Widget
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="background.default"
                        defaultTheme={customized}
                      />
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Modal
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="modal.background"
                        defaultTheme={customized}
                      />
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Card
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="card.background"
                        defaultTheme={customized}
                      />
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Button
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="button.primary"
                        defaultTheme={customized}
                      />
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Action
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="button.action"
                        defaultTheme={customized}
                      />
                    </Box>
                    <Typography variant="h5" component="h2" mt={1.5} mb={2}>
                      Text
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Primary
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="text.primary"
                        defaultTheme={customized}
                      />
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Secondary
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="text.secondary"
                        defaultTheme={customized}
                      />
                    </Box>
                    {/* Button Primary Text doesn't seem to have an effect */}
                    {/* <Box display="flex" alignItems="center">
                      <Typography sx={{ width: 80, marginRight: 1 }} gutterBottom>
                        Button
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="button.primaryText"
                      />
                    </Box> */}
                    <Box display="flex" alignItems="center">
                      <Typography
                        sx={{ width: 80, marginRight: 1 }}
                        gutterBottom
                      >
                        Action
                      </Typography>
                      <ColorPicker
                        customTheme={customTheme}
                        setCustomTheme={setCustomTheme}
                        path="button.actionText"
                        defaultTheme={customized}
                      />
                    </Box>
                    {/* This JSON text field is super advanced */}
                    {/* <TextField
                      label="Custom Theme JSON"
                      fullWidth
                      multiline
                      value={customThemeText}
                      onChange={handleThemeChange}
                      error={customThemeError}
                    /> */}
                    <Typography variant="h5" component="h2" mt={1.5}>
                      Font
                    </Typography>
                    <TextField
                      label="Primary"
                      name="primary"
                      fullWidth
                      value={getObjectPath(customTheme, "font.primary")}
                      onChange={handleFontChange}
                      size="small"
                      sx={{ mt: 2 }}
                    />
                    <TextField
                      label="Header"
                      name="header"
                      fullWidth
                      value={getObjectPath(customTheme, "font.header")}
                      onChange={handleFontChange}
                      size="small"
                      sx={{ mt: 2 }}
                    />
                    <TextField
                      label="Custom Font URL"
                      helperText="Paste the contents of the href attribute from the <link> tag. For example, https://fonts.googleapis.com/css2?family=Tulpen+One&display=swap"
                      fullWidth
                      value={fontHref}
                      onChange={handleFontURLChange}
                      size="small"
                      sx={{ mt: 2 }}
                    />
                  </>
                ) : null}
              </Box>
            </>
          ) : screen === 3 ? (
            <>
              <Button
                color="inherit"
                startIcon={<KeyboardArrowLeft />}
                onClick={backScreen}
                sx={{ mb: 1, justifyContent: "flex-start", pl: 2 }}
              >
                Routes
              </Button>
              <Box mx={2}>
                <Grid container spacing={2}>
                  {ROUTE_INFOS.map((r) => (
                    <Grid item key={r.key} sm={6}>
                      <RouteCard
                        route={r}
                        selected={!_routes || _routes.includes(r.key)}
                        setRoutes={setRoutes}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Button
                  onClick={handleClearRoutes}
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{ mt: 2, mr: 1 }}
                >
                  Select All
                </Button>
                <Button
                  onClick={handleNoneRoutes}
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{ mt: 2, mr: 1 }}
                >
                  Select None
                </Button>
              </Box>
            </>
          ) : screen === 4 ? (
            <>
              <Button
                color="inherit"
                startIcon={<KeyboardArrowLeft />}
                onClick={backScreen}
                sx={{ mb: 1, justifyContent: "flex-start", pl: 2 }}
              >
                Networks & Assets
              </Button>
              <Box mx={2}>
                <Typography variant="h5" component="h2" mt={1.5} mb={2}>
                  Environment
                </Typography>
                <RadioGroup
                  row
                  value={env}
                  onChange={handleEnvChange}
                  sx={{ mb: 0.5 }}
                >
                  <FormControlLabel
                    value="testnet"
                    control={<Radio />}
                    label="Testnet"
                  />
                  <FormControlLabel
                    value="mainnet"
                    control={<Radio />}
                    label="Mainnet"
                  />
                </RadioGroup>
                <Alert severity="info">
                  Note: The preview always displays Testnet.
                </Alert>
                <Divider sx={{ mt: 2 }} />
                <Typography variant="h5" component="h2" mt={4} mb={1}>
                  RPCs
                </Typography>
                <Typography variant="body2" mb={2}>
                  It is strongly recommended that you provide your own RPCs for
                  the best performance and functionality.
                </Typography>
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={handleRpcsOpen}
                >
                  Configure
                </Button>
                <Dialog
                  open={rpcsOpen}
                  onClose={handleRpcsClose}
                  fullWidth
                  maxWidth="md"
                >
                  <DialogTitle>Configure RPCs</DialogTitle>
                  <DialogContent>
                    {Object.keys(
                      env === "testnet" ? TESTNET.chains : MAINNET.chains
                    ).map((cn) => {
                      const chain = cn as ChainName;
                      return (
                        <TextField
                          key={chain}
                          label={chain}
                          name={chain}
                          value={_rpcs?.[chain] || ""}
                          onChange={handleRpcChange}
                          error={
                            _rpcs?.[chain] &&
                            !isValidRpc(_rpcs[chain as ChainName])
                              ? true
                              : false
                          }
                          fullWidth
                          sx={{ mb: 2 }}
                          helperText={
                            _rpcs?.[chain as ChainName] &&
                            !isValidRpc(_rpcs[chain as ChainName])
                              ? "Unknown RPC string scheme. Expected an http or websocket URI."
                              : `Default: ${
                                  (env === "mainnet"
                                    ? MAINNET.rpcs[chain as ChainName]
                                    : TESTNET.rpcs[chain as ChainName]) ||
                                  "None"
                                }`
                          }
                        />
                      );
                    })}
                  </DialogContent>
                  <DialogActions>
                    <Button variant="contained" onClick={handleRpcsClose}>
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>
                <Divider sx={{ mt: 2 }} />
                <Typography variant="h5" component="h2" mt={4} mb={2}>
                  Networks
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={selectedChains || Object.keys(chains)}
                  onChange={handleNetworksChange}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected: any) =>
                      !selectedChains
                        ? "All Networks"
                        : selectedChains.join(", "),
                  }}
                >
                  {Object.keys(chains).map((chain) => (
                    <MenuItem key={chain} value={chain}>
                      <Checkbox
                        checked={
                          !selectedChains ||
                          selectedChains.includes(chain as ChainName)
                        }
                      />
                      <ListItemText primary={chain} />
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  onClick={handleClearNetworks}
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{ mt: 1, mr: 1 }}
                >
                  Select All
                </Button>
                <Button
                  onClick={handleNoneNetworks}
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{ mt: 1, mr: 1 }}
                >
                  Select None
                </Button>
                <Divider sx={{ mt: 2 }} />
                <Typography variant="h5" component="h2" mt={4} mb={2}>
                  Tokens
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={
                    _tokens
                      ? _tokens
                      : env === "mainnet"
                      ? MAINNET_TOKENS
                      : TESTNET_TOKENS
                  }
                  onChange={handleTokensChange}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected: any) =>
                      !_tokens ? "All Tokens" : selected.join(", "),
                  }}
                >
                  {(env === "mainnet" ? MAINNET_TOKENS : TESTNET_TOKENS).map(
                    (t) => (
                      <MenuItem key={t} value={t}>
                        <Checkbox checked={!_tokens || _tokens.includes(t)} />
                        <ListItemText primary={t} />
                      </MenuItem>
                    )
                  )}
                </TextField>
                <Button
                  onClick={handleClearTokens}
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{ mt: 1, mr: 1 }}
                >
                  Select All
                </Button>
                <Button
                  onClick={handleNoneTokens}
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{ mt: 1, mr: 1 }}
                >
                  Select None
                </Button>
                <Divider sx={{ mt: 2 }} />
                <Typography variant="h5" component="h2" mt={4} mb={2}>
                  Defaults
                </Typography>
                <TextField
                  label="From Network"
                  select
                  fullWidth
                  value={defaultFromNetwork || ""}
                  onChange={handleDefaultFromNetworkChange}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value={""}>
                    <ListItemText primary="(None)" />
                  </MenuItem>
                  {selectedChains
                    ? selectedChains.map((chain) => (
                        <MenuItem key={chain} value={chain}>
                          <ListItemText primary={chain} />
                        </MenuItem>
                      ))
                    : Object.keys(chains).map((chain) => (
                        <MenuItem key={chain} value={chain}>
                          <ListItemText primary={chain} />
                        </MenuItem>
                      ))}
                </TextField>
                <TextField
                  label="To Network"
                  select
                  fullWidth
                  value={defaultToNetwork || ""}
                  onChange={handleDefaultToNetworkChange}
                  error={
                    defaultFromNetwork &&
                    defaultToNetwork &&
                    defaultFromNetwork === defaultToNetwork
                  }
                  helperText={
                    defaultFromNetwork &&
                    defaultToNetwork &&
                    defaultFromNetwork === defaultToNetwork
                      ? "Source and destination chain cannot be the same"
                      : undefined
                  }
                  sx={{ mb: 2 }}
                >
                  <MenuItem value={""}>
                    <ListItemText primary="(None)" />
                  </MenuItem>
                  {selectedChains
                    ? selectedChains.map((chain) => (
                        <MenuItem key={chain} value={chain}>
                          <ListItemText primary={chain} />
                        </MenuItem>
                      ))
                    : Object.keys(chains).map((chain) => (
                        <MenuItem key={chain} value={chain}>
                          <ListItemText primary={chain} />
                        </MenuItem>
                      ))}
                </TextField>
                <TextField
                  label="Token"
                  select
                  fullWidth
                  value={defaultToken || ""}
                  onChange={handleDefaultTokenChange}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value={""}>
                    <ListItemText primary="(None)" />
                  </MenuItem>
                  {(env === "mainnet" ? MAINNET_TOKENS : TESTNET_TOKENS).map(
                    (t) => (
                      <MenuItem key={t} value={t}>
                        <ListItemText primary={t} />
                      </MenuItem>
                    )
                  )}
                </TextField>
                <TextField
                  label="Required Network"
                  select
                  fullWidth
                  value={requiredNetwork || ""}
                  onChange={handleRequiredNetworkChange}
                  error={
                    defaultToNetwork &&
                    defaultFromNetwork &&
                    requiredNetwork &&
                    defaultFromNetwork !== requiredNetwork &&
                    defaultToNetwork !== requiredNetwork
                  }
                  helperText={
                    defaultToNetwork &&
                    defaultFromNetwork &&
                    requiredNetwork &&
                    defaultFromNetwork !== requiredNetwork &&
                    defaultToNetwork !== requiredNetwork
                      ? "Source chain or destination chain must equal the required network"
                      : "Enforces that this chain must be either the source or destination chain."
                  }
                  sx={{ mb: 2 }}
                >
                  <MenuItem value={""}>
                    <ListItemText primary="(None)" />
                  </MenuItem>
                  {selectedChains
                    ? selectedChains.map((chain) => (
                        <MenuItem key={chain} value={chain}>
                          <ListItemText primary={chain} />
                        </MenuItem>
                      ))
                    : Object.keys(chains).map((chain) => (
                        <MenuItem key={chain} value={chain}>
                          <ListItemText primary={chain} />
                        </MenuItem>
                      ))}
                </TextField>
              </Box>
            </>
          ) : screen === 5 ? (
            <>
              <Button
                color="inherit"
                startIcon={<KeyboardArrowLeft />}
                onClick={backScreen}
                sx={{ mb: 1, justifyContent: "flex-start", pl: 2 }}
              >
                Bridge Complete
              </Button>
              <Box mx={2}>
                <Typography variant="h5" component="h2" mt={1.5} mb={1}>
                  Call To Action
                </Typography>
                <Typography variant="body2" mb={2}>
                  A button will be displayed after the bridge is completed to
                  redirect users to the designated page.
                </Typography>
                <TextField
                  label="Text"
                  fullWidth
                  value={_ctaText}
                  onChange={handleCtaTextChange}
                  error={!!_ctaLink && !_ctaText}
                  helperText={
                    !!_ctaLink && !_ctaText
                      ? "Both text and link must be set"
                      : undefined
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Link"
                  fullWidth
                  value={_ctaLink}
                  onChange={handleCtaLinkChange}
                  error={!!_ctaText && !_ctaLink}
                  helperText={
                    !!_ctaText && !_ctaLink
                      ? "Both text and link must be set"
                      : undefined
                  }
                  sx={{ mb: 2 }}
                />
              </Box>
            </>
          ) : screen === 6 ? (
            <>
              <Button
                color="inherit"
                startIcon={<KeyboardArrowLeft />}
                onClick={backScreen}
                sx={{ mb: 1, justifyContent: "flex-start", pl: 2 }}
              >
                Get Code
              </Button>
              <Box mx={2}>
                <Tabs
                  value={codeType}
                  onChange={handleCodeTypeChange}
                  textColor="inherit"
                  variant="fullWidth"
                  sx={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <Tab label="HTML" />
                  <Tab label="React JSX" />
                </Tabs>
                <Card
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    px: 2,
                    py: 1,
                    mt: 1.5,
                  }}
                >
                  <Box display="flex" alignItems="center">
                    <Typography variant="subtitle1" sx={{ flexGrow: 1, pr: 1 }}>
                      Code Element
                    </Typography>
                    <IconButton onClick={handleCopy}>
                      <ContentCopy />
                    </IconButton>
                    <Snackbar
                      open={openCopySnack}
                      autoHideDuration={3000}
                      onClose={handleCopySnackClose}
                      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    >
                      <Alert severity="success">Script copied!</Alert>
                    </Snackbar>
                  </Box>
                  <Divider sx={{ mt: 1, mx: -2 }} />
                  <Box
                    sx={{
                      py: 2,
                      "& pre": {
                        m: 0,
                        whiteSpace: "pre-wrap",
                      },
                    }}
                  >
                    <pre>{codeType === 0 ? htmlCode : jsxCode}</pre>
                  </Box>
                </Card>
                {fontHref ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    You have included custom fonts. Don't forget to have them
                    included in your site.
                  </Alert>
                ) : null}
                <Button
                  color="inherit"
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    mt: 2,
                    p: 1.5,
                  }}
                  endIcon={<Launch />}
                  href="https://www.npmjs.com/package/@wormhole-foundation/wormhole-connect"
                  target="_blank"
                >
                  npm package
                </Button>
              </Box>
            </>
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            color="inherit"
            sx={{ mt: 3, mb: 1, justifyContent: "flex-start", pl: 2 }}
            onClick={handleResetAll}
          >
            Reset all changes
          </Button>
        </Drawer>
        <Container sx={{ pt: 10, pb: 7.5 }}>
          {open ? null : (
            <>
              <Typography variant="h2" component="h1" gutterBottom>
                Wormhole Connect
              </Typography>
              <Typography maxWidth="620px" sx={{ mb: 5 }}>
                Bring all the functionality and utility of Wormhole right into
                your application and remove all of the complexity.
              </Typography>
              <Typography variant="h4" component="h2" gutterBottom>
                Integrate Connect Easily
              </Typography>
              <Typography maxWidth="620px">
                Get a look that blends seamlessly with your app in{" "}
                <strong>5 minutes</strong> and <strong>3 lines</strong> of code.
              </Typography>
              <Grid container sx={{ mt: 4, mb: 2, mx: -2 }}>
                <Grid item xs={12} md={4} sx={{ mb: 2 }}>
                  <StepCard
                    number={1}
                    title="Customize"
                    description="Simply pull out the tab and start customizing."
                  />
                </Grid>
                <Grid item xs={12} md={4} sx={{ mb: 2 }}>
                  <StepCard
                    number={2}
                    title="Copy Code"
                    description="Copy the code, access Wormhole Connect on your experience."
                  />
                </Grid>
                <Grid item xs={12} md={4} sx={{ mb: 2 }}>
                  <StepCard
                    number={3}
                    title="Deploy"
                    description="Have your very own Wormhole experience live."
                  />
                </Grid>
              </Grid>
              <Button
                variant="outlined"
                color="inherit"
                sx={{ mb: 6 }}
                size="large"
                endIcon={<EditOutlined />}
                onClick={handleOpen}
              >
                Get Started!
              </Button>
            </>
          )}
          <Typography variant="h4" component="h2" gutterBottom>
            Preview
          </Typography>

          <ErrorBoundary>
            {!hideConnect ? (
              <WormholeConnect
                config={{ ...config, previewMode: true }}
                theme={customTheme}
                key={JSON.stringify(config)}
              />
            ) : (
              <></>
            )}
          </ErrorBoundary>
        </Container>
      </Box>
    </Background>
  );
}

export default App;
