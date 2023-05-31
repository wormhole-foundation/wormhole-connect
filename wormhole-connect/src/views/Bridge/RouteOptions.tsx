import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { RootState } from '../../store';
import BridgeCollapse from './Collapse';
import { LINK, joinClass } from '../../utils/style';
import InputContainer from '../../components/InputContainer';
import { TOKENS } from '../../config';
import TokenIcon from '../../icons/TokenIcons';
import ArrowRightIcon from '../../icons/ArrowRight';
import HashflowIcon from '../../icons/Hashflow';

const useStyles = makeStyles()((theme) => ({
  link: {
    ...LINK(theme),
    margin: '0 0 0 4px',
  },
  tag: {
    padding: '4px 8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filled: {
    backgroundColor: theme.palette.card.secondary,
  },
  route: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
}));

type TagProps = {
  icon: JSX.Element;
  text: string;
  colorFilled?: boolean;
};
function Tag(props: TagProps) {
  const { classes } = useStyles();
  // const tokenConfig = TOKENS[props.token];
  // if (!tokenConfig) return <></>;
  return (
    <div
      className={joinClass([
        classes.tag,
        !!props.colorFilled && classes.filled,
      ])}
    >
      {props.icon}
      {props.text}
    </div>
  );
}

function RouteOptions() {
  const { classes } = useStyles();
  const theme = useTheme();
  // const [collapsed, setCollapsed] = useState(false);
  const { isTransactionInProgress, token, destToken } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const fromTokenConfig = TOKENS[token];
  const fromTokenIcon = fromTokenConfig && (
    <TokenIcon name={fromTokenConfig.icon} height={16} />
  );
  const toTokenConfig = TOKENS[destToken];
  const toTokenIcon = toTokenConfig && (
    <TokenIcon name={toTokenConfig.icon} height={16} />
  );
  const hashflowIcon = <HashflowIcon sx={{ fontSize: 16 }} />;

  const banner = (
    <>
      This route provided by
      <a
        href="https://www.hashflow.com/"
        target="_blank"
        className={classes.link}
        rel="noreferrer"
      >
        Hashflow
      </a>
    </>
  );

  return (
    <BridgeCollapse
      title="Route"
      disabled={isTransactionInProgress}
      controlled
      banner={banner}
      value={false}
      onCollapseChange={() => {}}
    >
      <InputContainer
        styles={{
          boxShadow: 'none',
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0',
        }}
        bg={theme.palette.options.select}
      >
        {fromTokenConfig && toTokenConfig && (
          <div className={classes.route}>
            <Tag
              icon={fromTokenIcon}
              text={fromTokenConfig.symbol}
              colorFilled
            />
            <ArrowRightIcon />
            <Tag icon={hashflowIcon} text={'Hashflow'} />
            <ArrowRightIcon />
            <Tag icon={toTokenIcon} text={toTokenConfig.symbol} colorFilled />
          </div>
        )}
      </InputContainer>
    </BridgeCollapse>
  );
}

export default RouteOptions;
