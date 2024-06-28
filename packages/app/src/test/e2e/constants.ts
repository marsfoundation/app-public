/**
 * App reads tokens config from the chain but we need to mint tokens in E2E tests so we maintain this list.
 *
 * Tokens are from mainnet network.
 */
export const TOKENS_ON_FORK = {
  1: {
    DAI: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
    },
    sDAI: {
      address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
      decimals: 18,
    },
    GNO: {
      address: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
      decimals: 18,
    },
    WETH: {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
    },
    wstETH: {
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      decimals: 18,
    },
    rETH: {
      address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
      decimals: 18,
    },
    WBTC: {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
    },
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
    },
  },
  100: {
    WXDAI: {
      address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
      decimals: 18,
    },
    USDC: {
      address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
      decimals: 6,
    },
    EURe: {
      address: '0xcB444e90D8198415266c6a2724b7900fb12FC56E',
      decimals: 18,
    },
    USDT: {
      address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
      decimals: 6,
    },
    GNO: {
      address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
      decimals: 18,
    },
    sDAI: {
      address: '0xaf204776c7245bF4147c2612BF6e5972Ee483701',
      decimals: 18,
    },
    WETH: {
      address: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
      decimals: 18,
    },
    wstETH: {
      address: '0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6',
      decimals: 18,
    },
  },
} as const

type NonNativeTokens = keyof (typeof TOKENS_ON_FORK)[1] | keyof (typeof TOKENS_ON_FORK)[100]
export type AssetsInTests = 'ETH' | 'XDAI' | NonNativeTokens

// @note At this block number:
// DAI oracle returns exactly 1
// GNO is offboarded
export const DEFAULT_BLOCK_NUMBER = 18562430n
export const GNOSIS_DEFAULT_BLOCK_NUMBER = 34543308n

export const PSM_ACTIONS_DEPLOYED = 20026000n
export const PSM_ACTIONS_DEPLOYED_DATE = new Date('2024-06-06T10:10:10Z')

export const WBTC_SUPPLY_CAP_REACHED_BLOCK_NUMBER = 19034436n

export const GNO_ACTIVE_BLOCK_NUMBER = 18365842n
