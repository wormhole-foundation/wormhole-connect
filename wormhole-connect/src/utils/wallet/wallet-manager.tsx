import React, { Fragment, useRef } from "react"
import { toChainId } from '@wormhole-foundation/sdk';
import { DynamicContextProvider, useDynamicContext, useUserWallets } from "@dynamic-labs/sdk-react-core"
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum"
import { SolanaWalletConnectors } from "@dynamic-labs/solana"
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos"

import { Theme } from "@mui/material"
import WalletSidebar from "views/v2/Bridge/WalletConnector/Sidebar"
import { TransferWallet } from "."
import { ChainId, isEVMChain } from "@xlabs-libs/wallet-aggregator-core";
import { useSelector } from "react-redux";
import { RootState } from "store";
import { DynamicWallet, isChainSupportedByDynamicWallet } from "./dynamic-wallet";

interface WalletManagerProps {
    connectWallet: (type: TransferWallet) => void
    setWalletConnection: (type: TransferWallet, wallet: WalletConnection) => void
}
const WalletManager = React.createContext<WalletManagerProps>({ connectWallet: () => {}, setWalletConnection: () => {} })
const useWalletManager = () => {
    const context = React.useContext(WalletManager)
    return context
}
const defaultWalletSidebarConfig = { isOpen: false, type: TransferWallet.SENDING };

type OnConnectCallback = (wallet: DynamicWallet) => void

interface InternalWMProviderProps {
    chainRef: React.MutableRefObject<string|undefined>
    onConnectRef: React.MutableRefObject<OnConnectCallback|undefined>
}

type WalletConnection = DynamicWallet | any

const InternalWMComponent: React.FC<React.PropsWithChildren<InternalWMProviderProps>> = ({ children, chainRef, onConnectRef }) => {
    const { sdkHasLoaded, setShowAuthFlow: setShowDynamicWalletAuthModal, primaryWallet } = useDynamicContext();
    const userWallets = useUserWallets()
    const [walletSidebarProps, setWalletSidebarProps] = React.useState<{ isOpen: boolean, type: TransferWallet }>(defaultWalletSidebarConfig);
    const {
        fromChain: sourceChain,
        toChain: destChain,
    } = useSelector((state: RootState) => state.transferInput);

    const walletConnection = React.useRef<{ sending?: WalletConnection; receiving?: WalletConnection; type?: TransferWallet}>({}).current

    const connectedWalletsFromDynamic = React.useMemo(() => {
        const wallets: NonNullable<typeof primaryWallet>[] = []
        if (primaryWallet) {
            wallets.push(primaryWallet)
        }
        if (userWallets) {
            wallets.push(...userWallets)
        }
        return wallets
    }, [primaryWallet, userWallets])

    const disconnectAllConnectedDynamicWallets = React.useCallback(() => {
        connectedWalletsFromDynamic.reverse().forEach((wallet) => {
            wallet.connector.removeAllListeners()
            wallet.connector.endSession().then(() => console.log(`Disconnected wallet ${wallet.connector.name}`))
        })
    }, [connectedWalletsFromDynamic])

    console.log(walletConnection, disconnectAllConnectedDynamicWallets)

    const connectWallet = React.useCallback((type: TransferWallet) => {
        const chain = type === TransferWallet.SENDING ? sourceChain : destChain
        walletConnection.type = type
        if (!chain) return
        if (isChainSupportedByDynamicWallet(chain)) {
            chainRef.current = chain
            setShowDynamicWalletAuthModal(true)
        } else {
            setWalletSidebarProps({ isOpen: true, type });
        }
    }, [sdkHasLoaded, sourceChain, destChain])

    const setWalletConnection = React.useCallback((type: TransferWallet, wallet: WalletConnection) => {
        walletConnection[type] = wallet;
    }, [])

    React.useEffect(() => {
        onConnectRef.current = (wallet) => {
            if (walletConnection.type === TransferWallet.SENDING) {
                walletConnection.sending = undefined
            } else {
                walletConnection.receiving = undefined
            }
        }
    }, [sdkHasLoaded])

    const walletManager = React.useMemo(() => ({ connectWallet, setWalletConnection}), [connectWallet, setWalletConnection])

    return <>
        <WalletManager.Provider value={walletManager}>
            { children }
            <WalletSidebar
                    open={walletSidebarProps.isOpen}
                    type={walletSidebarProps.type}
                    onClose={() => {
                    setWalletSidebarProps(defaultWalletSidebarConfig)
                }}
            />
        </WalletManager.Provider>
    </>
}

const WalletManagerProvider: React.FC<React.PropsWithChildren<{ theme?: Theme }>> = ({ children, theme }) => {
    const chainRef = useRef<string|undefined>(undefined)
    const onConnectRef = useRef<OnConnectCallback|undefined>(undefined)
    return <Fragment>
        <DynamicContextProvider
            // TODO: Config theme
            // theme={ theme ?? { mode: "dark" } }
            settings={{
                environmentId: "62ee0eb5-f9dc-4b19-8ae7-09b371cc0873",
                initialAuthenticationMode: "connect-only",
                walletConnectors: [
                    EthereumWalletConnectors,
                    SolanaWalletConnectors,
                    CosmosWalletConnectors,
                ],
                walletsFilter: (wallets) => {
                    const chain = chainRef.current
                    if (chain && isEVMChain(toChainId(chain) as ChainId)) {
                        return wallets.filter(w => w.walletConnector.supportedChains.includes("EVM"))
                    } else if (chain === "Solana") {
                        return wallets.filter(w => w.walletConnector.supportedChains.includes("SOL"))
                    } else if (chain === "Cosmoshub") {
                        return wallets.filter(w => w.walletConnector.supportedChains.includes("COSMOS"))
                    } else {
                        return []
                    }
                },
                events: {
                    onAuthSuccess: ({ primaryWallet }) => {
                        console.log("onAuthSuccess", primaryWallet?.chain, primaryWallet?.address, primaryWallet?.connector.name)
                        if (primaryWallet)
                            onConnectRef.current?.(primaryWallet)
                    },
                    onWalletAdded: ({ wallet }) => {
                        console.log("onAuthSuccess", wallet?.chain, wallet?.address, wallet?.connector.name)
                        onConnectRef.current?.(wallet)
                    }
                },
                // TODO: Config networks
            }}
        >
            <InternalWMComponent chainRef={chainRef} onConnectRef={onConnectRef}>
                {children}
            </InternalWMComponent>
        </DynamicContextProvider>
    </Fragment>
}

export { WalletManagerProvider, useWalletManager }