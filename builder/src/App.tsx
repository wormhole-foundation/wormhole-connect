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
import WormholeBridge, {
  ChainName,
  MainnetChainName,
  TestnetChainName,
  Theme,
  WormholeConnectConfig,
  defaultTheme,
} from "@wormhole-foundation/wormhole-connect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import Background from "./Background";
import { copyTextToClipboard } from "./utils";

type Network = {
  name: string;
  testnet: TestnetChainName;
  mainnet: MainnetChainName;
};

const NETWORKS: Network[] = [
  {
    name: "Solana",
    testnet: "solana",
    mainnet: "solana",
  },
  {
    name: "Ethereum",

    testnet: "goerli",
    mainnet: "ethereum",
  },
  {
    name: "BSC",
    testnet: "bsc",
    mainnet: "bsc",
  },
  {
    name: "Polygon",
    testnet: "mumbai",
    mainnet: "polygon",
  },
  {
    name: "Avalanche",
    testnet: "fuji",
    mainnet: "avalanche",
  },
  {
    name: "Fantom",
    testnet: "fantom",
    mainnet: "fantom",
  },
  {
    name: "Celo",
    testnet: "alfajores",
    mainnet: "celo",
  },
  {
    name: "Moonbeam",
    testnet: "moonbasealpha",
    mainnet: "moonbeam",
  },
  {
    name: "Sui",
    testnet: "sui",
    mainnet: "sui",
  },
  {
    name: "Aptos",
    testnet: "aptos",
    mainnet: "aptos",
  },
  {
    name: "Base",
    testnet: "basegoerli",
    mainnet: "base",
  },
  {
    name: "Osmosis",
    testnet: "osmosis",
    mainnet: "osmosis",
  },
];

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

const customized = defaultTheme;
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
  const [_customTheme, setCustomTheme] = useState<Theme | undefined>(undefined);
  const [debouncedCustomTheme] = useDebounce(_customTheme, 1000);
  const customTheme =
    _customTheme === undefined ? undefined : debouncedCustomTheme;
  const [customThemeText, setCustomThemeText] = useState(defaultThemeJSON);
  const [customThemeError, setCustomThemeError] = useState<boolean>(false);
  const handleModeChange = useCallback(
    (e: any, value: string) => {
      if (value === "dark" || value === "light") {
        setMode(value);
        setCustomTheme(undefined);
      } else {
        setMode(undefined);
        try {
          setCustomTheme(JSON.parse(customThemeText));
        } catch (e) {}
      }
    },
    [customThemeText]
  );
  const handleThemeChange = useCallback((e: any) => {
    try {
      const str = e.target.value;
      setCustomThemeText(str);
      setCustomTheme(JSON.parse(str));
      setCustomThemeError(false);
    } catch (e) {
      setCustomThemeError(true);
    }
  }, []);
  // END THEME
  // BEGIN ENV
  const [env, setEnv] = useState<"testnet" | "mainnet">("testnet");
  const [_networkIndexes, setNetworkIndexes] = useState<number[] | undefined>(
    undefined
  );
  const [networkIndexes] = useDebounce(_networkIndexes, 1000);
  const handleClearNetworks = useCallback(() => {
    setNetworkIndexes(undefined);
  }, []);
  const handleNetworksChange = useCallback((e: any) => {
    setNetworkIndexes(
      typeof e.target.value === "string"
        ? e.target.value
            .split(",")
            .map((v: string) => parseInt(v))
            .sort((a: number, b: number) => a - b)
        : e.target.value.sort((a: number, b: number) => a - b)
    );
  }, []);
  const handleEnvChange = useCallback((e: any, value: string) => {
    if (value === "testnet" || value === "mainnet") {
      setEnv(value);
    }
  }, []);
  const [networks, testnetNetworks] = useMemo(() => {
    return !networkIndexes
      ? [undefined, undefined]
      : NETWORKS.filter((v, i) => networkIndexes.indexOf(i) > -1).reduce<
          [ChainName[], TestnetChainName[]]
        >(
          ([networks, testnetNetworks], v) => [
            [...networks, v[env]],
            [...testnetNetworks, v.testnet],
          ],
          [[], []]
        );
  }, [networkIndexes, env]);
  // END ENV
  const handleResetAll = useCallback(() => {
    setMode("dark");
    setCustomTheme(undefined);
    setCustomThemeText(defaultThemeJSON);
    setCustomThemeError(false);
    setFontHref("");
  }, []);
  // START CODE
  const [codeType, setCodeType] = useState(0);
  const handleCodeTypeChange = useCallback(
    (event: React.SyntheticEvent, newValue: number) => {
      setCodeType(newValue);
    },
    []
  );
  // NOTE: the WormholeBridge component is keyed by the stringified version of config
  // because otherwise the component did not update on changes
  const config: WormholeConnectConfig = useMemo(
    () => ({
      env: "testnet", // always testnet for the builder
      networks: testnetNetworks, // always testnet for the builder
      mode,
      customTheme,
    }),
    [mode, customTheme, testnetNetworks]
  );
  // TODO: pull latest version from npm / offer pinning, tag, or latest
  const version = "0.0.12";
  const [htmlCode, jsxCode] = useMemo(() => {
    const realConfig = { ...config, env, networks };
    const realConfigString = JSON.stringify(realConfig);
    return [
      `<div id="wormhole-connect" config='${realConfigString}' /></div>
<script src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@${version}/dist/main.js"></script>
<link src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@${version}/dist/main.css"/>`,
      `import WormholeBridge from '@wormhole-foundation/wormhole-connect';
function App() {
  return (
    <WormholeBridge config={${realConfigString}} />
  );
}`,
    ];
  }, [config, env, networks]);
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
                  text="Styling (Coming Soon)"
                  number={1}
                  setScreen={setScreen}
                  disabled
                />
                <ScreenButton text="Palette" number={2} setScreen={setScreen} />
                <ScreenButton
                  text="Networks & Assets"
                  number={3}
                  setScreen={setScreen}
                />
                <ScreenButton
                  text="Bridge Complete (Coming Soon)"
                  number={4}
                  optional
                  setScreen={setScreen}
                  disabled
                />
                <Typography variant="h5" component="h2" mt={1.5} mb={2}>
                  Deploy
                </Typography>
                <ScreenButton
                  text="Get Code"
                  number={5}
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
                    <TextField
                      label="Custom Theme JSON"
                      fullWidth
                      multiline
                      value={customThemeText}
                      onChange={handleThemeChange}
                      error={customThemeError}
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
                <Typography variant="h5" component="h2" mt={4} mb={2}>
                  Networks
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={
                    _networkIndexes
                      ? _networkIndexes
                      : NETWORKS.map((_, i) => i)
                  }
                  onChange={handleNetworksChange}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected: any) =>
                      !_networkIndexes
                        ? "All Networks"
                        : selected
                            .map((i: number) => NETWORKS[i].name)
                            .join(", "),
                  }}
                >
                  {NETWORKS.map((network, idx) => (
                    <MenuItem key={idx} value={idx}>
                      <Checkbox
                        checked={
                          !_networkIndexes || _networkIndexes.indexOf(idx) > -1
                        }
                      />
                      <ListItemText primary={network.name} />
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  onClick={handleClearNetworks}
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Select All
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
                Bridge Complete
              </Button>
            </>
          ) : screen === 5 ? (
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
          <WormholeBridge config={config} key={JSON.stringify(config)} />
        </Container>
      </Box>
    </Background>
  );
}

export default App;
