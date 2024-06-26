import { waitFor } from '@testing-library/react'
import { gnosis, mainnet } from 'viem/chains'
import { vi } from 'vitest'

import { NormalizedUnitNumber, Percentage } from '@/domain/types/NumericValues'
import { testAddresses, testTokens } from '@/test/integration/constants'
import { setupHookRenderer } from '@/test/integration/setupHookRenderer'

import { defaultExchangeMaxSlippage } from '../state/actions-settings'
import {
  LIFI_DEFAULT_FEE,
  LIFI_DEFAULT_FEE_INTEGRATOR_KEY,
  LIFI_WAIVED_FEE,
  LIFI_WAIVED_FEE_INTEGRATOR_KEY,
} from './evaluateSwap'
import { LifiQuoteRequestParams, LifiReverseQuoteRequestParams } from './lifi/LifiClient'
import { useSwap } from './useSwap'

const account = testAddresses.alice
const { DAI, USDC, USDT, sDAI, XDAI } = testTokens
const amount = NormalizedUnitNumber(1)

const hookRenderer = setupHookRenderer({
  hook: useSwap,
  account,
  chain: mainnet,
  args: {
    swapParamsBase: {
      type: 'direct',
      fromToken: DAI,
      toToken: sDAI,
      value: amount,
    },
    defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
  },
})

describe(useSwap, () => {
  let mockFetch = vi.fn()
  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('mainnet', () => {
    it('DAI to sDAI is waived', async () => {
      hookRenderer()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
      })

      expect(mockFetch).toHaveBeenCalledWithURLParams({
        fromChain: mainnet.id.toString(),
        toChain: mainnet.id.toString(),
        fromAddress: account,
        fromAmount: DAI.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
        fee: LIFI_WAIVED_FEE.toString(),
        fromToken: DAI.address,
        toToken: sDAI.address,
      } satisfies LifiQuoteRequestParams)
    })

    it('USDC to sDAI is waived', async () => {
      hookRenderer({
        args: {
          swapParamsBase: {
            type: 'direct',
            fromToken: USDC,
            toToken: sDAI,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
      })

      expect(mockFetch).toHaveBeenCalledWithURLParams({
        fromChain: mainnet.id.toString(),
        toChain: mainnet.id.toString(),
        fromAddress: account,
        fromAmount: USDC.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
        fee: LIFI_WAIVED_FEE.toString(),
        fromToken: USDC.address,
        toToken: sDAI.address,
      } satisfies LifiQuoteRequestParams)
    })

    it('USDT to sDAI is not waived', async () => {
      hookRenderer({
        args: {
          swapParamsBase: {
            type: 'direct',
            fromToken: USDT,
            toToken: sDAI,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
      })

      expect(mockFetch).toHaveBeenCalledWithURLParams({
        fromChain: mainnet.id.toString(),
        toChain: mainnet.id.toString(),
        fromAddress: account,
        fromAmount: USDT.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_DEFAULT_FEE_INTEGRATOR_KEY,
        fee: LIFI_DEFAULT_FEE.toString(),
        fromToken: USDT.address,
        toToken: sDAI.address,
      } satisfies LifiQuoteRequestParams)
    })

    it('sDAI to DAI is waived', async () => {
      hookRenderer({
        args: {
          swapParamsBase: {
            type: 'reverse',
            fromToken: sDAI,
            toToken: DAI,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote/contractCalls')
      })

      expect(mockFetch).toHaveBeenCalledWithBodyParams({
        fromChain: mainnet.id.toString(),
        toChain: mainnet.id.toString(),
        fromAddress: account,
        toAmount: DAI.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
        fee: LIFI_WAIVED_FEE.toString(),
        fromToken: sDAI.address,
        toToken: DAI.address,
      } satisfies Omit<LifiReverseQuoteRequestParams, 'contractCalls'>)
    })

    it('sDAI to USDC is waived', async () => {
      hookRenderer({
        args: {
          swapParamsBase: {
            type: 'reverse',
            fromToken: sDAI,
            toToken: USDC,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote/contractCalls')
      })

      expect(mockFetch).toHaveBeenCalledWithBodyParams({
        fromChain: mainnet.id.toString(),
        toChain: mainnet.id.toString(),
        fromAddress: account,
        toAmount: USDC.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
        fee: LIFI_WAIVED_FEE.toString(),
        fromToken: sDAI.address,
        toToken: USDC.address,
      } satisfies Omit<LifiReverseQuoteRequestParams, 'contractCalls'>)
    })

    it('sDAI to USDT is not waived', async () => {
      hookRenderer({
        args: {
          swapParamsBase: {
            type: 'reverse',
            fromToken: sDAI,
            toToken: USDT,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote/contractCalls')
      })

      expect(mockFetch).toHaveBeenCalledWithBodyParams({
        fromChain: mainnet.id.toString(),
        toChain: mainnet.id.toString(),
        fromAddress: account,
        toAmount: USDT.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_DEFAULT_FEE_INTEGRATOR_KEY,
        fee: LIFI_DEFAULT_FEE.toString(),
        fromToken: sDAI.address,
        toToken: USDT.address,
      } satisfies Omit<LifiReverseQuoteRequestParams, 'contractCalls'>)
    })
  })

  describe('gnosis', () => {
    it('XDAI to SDAI is waived', async () => {
      hookRenderer({
        chain: gnosis,
        args: {
          swapParamsBase: {
            type: 'direct',
            fromToken: XDAI,
            toToken: sDAI,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
      })

      expect(mockFetch).toHaveBeenCalledWithURLParams({
        fromChain: gnosis.id.toString(),
        toChain: gnosis.id.toString(),
        fromAddress: account,
        fromAmount: XDAI.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
        fee: LIFI_WAIVED_FEE.toString(),
        fromToken: XDAI.address,
        toToken: sDAI.address,
      } satisfies LifiQuoteRequestParams)
    })

    it('USDC to SDAI is not waived', async () => {
      hookRenderer({
        chain: gnosis,
        args: {
          swapParamsBase: {
            type: 'direct',
            fromToken: USDC,
            toToken: sDAI,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
      })

      expect(mockFetch).toHaveBeenCalledWithURLParams({
        fromChain: gnosis.id.toString(),
        toChain: gnosis.id.toString(),
        fromAddress: account,
        fromAmount: USDC.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_DEFAULT_FEE_INTEGRATOR_KEY,
        fee: LIFI_DEFAULT_FEE.toString(),
        fromToken: USDC.address,
        toToken: sDAI.address,
      } satisfies LifiQuoteRequestParams)
    })

    it('USDT to SDAI is not waived', async () => {
      hookRenderer({
        chain: gnosis,
        args: {
          swapParamsBase: {
            type: 'direct',
            fromToken: USDT,
            toToken: sDAI,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
      })

      expect(mockFetch).toHaveBeenCalledWithURLParams({
        fromChain: gnosis.id.toString(),
        toChain: gnosis.id.toString(),
        fromAddress: account,
        fromAmount: USDT.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_DEFAULT_FEE_INTEGRATOR_KEY,
        fee: LIFI_DEFAULT_FEE.toString(),
        fromToken: USDT.address,
        toToken: sDAI.address,
      } satisfies LifiQuoteRequestParams)
    })

    it('sDAI to XDAI is waived', async () => {
      hookRenderer({
        chain: gnosis,
        args: {
          swapParamsBase: {
            type: 'reverse',
            fromToken: sDAI,
            toToken: XDAI,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote/contractCalls')
      })

      expect(mockFetch).toHaveBeenCalledWithBodyParams({
        fromChain: gnosis.id.toString(),
        toChain: gnosis.id.toString(),
        fromAddress: account,
        toAmount: XDAI.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
        fee: LIFI_WAIVED_FEE.toString(),
        fromToken: sDAI.address,
        toToken: XDAI.address,
      } satisfies Omit<LifiReverseQuoteRequestParams, 'contractCalls'>)
    })

    it('sDAI to USDC is not waived', async () => {
      hookRenderer({
        chain: gnosis,
        args: {
          swapParamsBase: {
            type: 'reverse',
            fromToken: sDAI,
            toToken: USDC,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote/contractCalls')
      })

      expect(mockFetch).toHaveBeenCalledWithBodyParams({
        fromChain: gnosis.id.toString(),
        toChain: gnosis.id.toString(),
        fromAddress: account,
        toAmount: USDC.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_DEFAULT_FEE_INTEGRATOR_KEY,
        fee: LIFI_DEFAULT_FEE.toString(),
        fromToken: sDAI.address,
        toToken: USDC.address,
      } satisfies Omit<LifiReverseQuoteRequestParams, 'contractCalls'>)
    })

    it('sDAI to USDT is not waived', async () => {
      hookRenderer({
        chain: gnosis,
        args: {
          swapParamsBase: {
            type: 'reverse',
            fromToken: sDAI,
            toToken: USDT,
            value: amount,
          },
          defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
        },
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote/contractCalls')
      })

      expect(mockFetch).toHaveBeenCalledWithBodyParams({
        fromChain: gnosis.id.toString(),
        toChain: gnosis.id.toString(),
        fromAddress: account,
        toAmount: USDT.toBaseUnit(amount).toString(),
        slippage: defaultExchangeMaxSlippage.toString(),
        integrator: LIFI_DEFAULT_FEE_INTEGRATOR_KEY,
        fee: LIFI_DEFAULT_FEE.toString(),
        fromToken: sDAI.address,
        toToken: USDT.address,
      } satisfies Omit<LifiReverseQuoteRequestParams, 'contractCalls'>)
    })
  })

  it('uses dynamic max slippage for waived routes', async () => {
    const amount = NormalizedUnitNumber(10_000_000)
    hookRenderer({
      args: {
        swapParamsBase: {
          type: 'direct',
          fromToken: DAI,
          toToken: sDAI,
          value: amount,
        },
        defaults: { defaultMaxSlippage: defaultExchangeMaxSlippage },
      },
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
    })

    expect(mockFetch).toHaveBeenCalledWithURLParams({
      fromChain: mainnet.id.toString(),
      toChain: mainnet.id.toString(),
      fromAddress: account,
      fromAmount: DAI.toBaseUnit(amount).toFixed(),
      slippage: Percentage(0.00001).toString(),
      integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
      fee: LIFI_WAIVED_FEE.toString(),
      fromToken: DAI.address,
      toToken: sDAI.address,
    } satisfies LifiQuoteRequestParams)
  })

  it('respects defaultMaxSlippage', async () => {
    const defaultMaxSlippage = Percentage(0.1)
    hookRenderer({
      args: {
        swapParamsBase: {
          type: 'direct',
          fromToken: DAI,
          toToken: sDAI,
          value: amount,
        },
        defaults: { defaultMaxSlippage },
      },
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWithURL('https://li.quest/v1/quote')
    })

    expect(mockFetch).toHaveBeenCalledWithURLParams({
      fromChain: mainnet.id.toString(),
      toChain: mainnet.id.toString(),
      fromAddress: account,
      fromAmount: DAI.toBaseUnit(amount).toString(),
      slippage: defaultMaxSlippage.toString(),
      integrator: LIFI_WAIVED_FEE_INTEGRATOR_KEY,
      fee: LIFI_WAIVED_FEE.toString(),
      fromToken: DAI.address,
      toToken: sDAI.address,
    } satisfies LifiQuoteRequestParams)
  })
})
