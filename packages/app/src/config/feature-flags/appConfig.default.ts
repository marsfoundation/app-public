import { mainnet } from 'viem/chains'

import { NormalizedUnitNumber } from '@/domain/types/NumericValues'

import { AppConfig } from '.'
import { clientEnv } from './clientEnv'

export function getDefaultAppConfig(): AppConfig {
  return {
    sandbox: featureFlag('VITE_FEATURE_SANDBOX') && {
      originChainId: mainnet.id,
      chainName: 'Sandbox Mode',

      mintBalances: {
        etherAmt: NormalizedUnitNumber(10_000),
        tokenAmt: NormalizedUnitNumber(10_000),
        tokens: {
          DAI: {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            decimals: 18,
          },
          sDAI: {
            address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
            decimals: 18,
          },
          USDC: {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            decimals: 6,
          },
          WETH: {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
          },
          wstETH: {
            address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
            decimals: 18,
          },
          WBTC: {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            decimals: 8,
          },
          GNO: {
            address: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
            decimals: 18,
          },
          rETH: {
            address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
            decimals: 18,
          },
          USDT: {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6,
          },
        },
      },
    },
  }
}

/**
 * @note: do not use outside this file because it will break dead code elimination
 */
function featureFlag(key: string): true | undefined {
  return clientEnv.boolean(key) || undefined
}
