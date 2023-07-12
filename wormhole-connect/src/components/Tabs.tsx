import * as React from 'react';
import { makeStyles } from 'tss-react/mui';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

const useStyles = makeStyles()((theme) => ({
  tabs: {
    display: 'flex',
    flexDirection: 'row',
    justifyContext: 'space-between',
  },
  tab: {
    flexGrow: 1,
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

type TabData = {
  label: string;
  panel: React.ReactNode;
};

export default function BasicTabs(props: { tabs: TabData[] }) {
  const { tabs } = props;
  const { classes } = useStyles();
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: `${theme.palette.divider}` }}>
        <Tabs value={value} onChange={handleChange} className={classes.tabs}>
          {tabs.map((tab, i) => (
            <Tab
              label={tab.label}
              {...a11yProps(i)}
              className={classes.tab}
              key={`tab${i}`}
            />
          ))}
        </Tabs>
      </Box>
      {tabs.map((tab, i) => (
        <CustomTabPanel value={value} index={i} key={`panel${i}`}>
          {tab.panel}
        </CustomTabPanel>
      ))}
    </Box>
  );
}
