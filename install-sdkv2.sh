version="0.6.9"

packages=(
  "@wormhole-foundation/sdk-aptos-tokenbridge"
  "@wormhole-foundation/sdk-aptos-core"
  "@wormhole-foundation/sdk-aptos"
  "@wormhole-foundation/sdk-sui-tokenbridge"
  "@wormhole-foundation/sdk-sui-core"
  "@wormhole-foundation/sdk-sui"
  "@wormhole-foundation/sdk-algorand-tokenbridge"
  "@wormhole-foundation/sdk-algorand-core"
  "@wormhole-foundation/sdk-algorand"
  "@wormhole-foundation/sdk-cosmwasm-ibc"
  "@wormhole-foundation/sdk-cosmwasm-tokenbridge"
  "@wormhole-foundation/sdk-cosmwasm-core"
  "@wormhole-foundation/sdk-cosmwasm"
  "@wormhole-foundation/sdk-solana-cctp"
  "@wormhole-foundation/sdk-solana-tokenbridge"
  "@wormhole-foundation/sdk-solana-core"
  "@wormhole-foundation/sdk-solana"
  "@wormhole-foundation/sdk-evm-portico"
  "@wormhole-foundation/sdk-evm-cctp"
  "@wormhole-foundation/sdk-evm-tokenbridge"
  "@wormhole-foundation/sdk-evm-core"
  "@wormhole-foundation/sdk-evm"
  "@wormhole-foundation/sdk-connect"
  "@wormhole-foundation/sdk-icons"
  "@wormhole-foundation/sdk-definitions"
  "@wormhole-foundation/sdk-base"
)

cd wormhole-connect

for package in "${packages[@]}"; do
  npm link "$package"
done

