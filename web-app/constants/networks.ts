export interface BridgeSupportedToken {
  name: string;
  symbol: string;
  address: string;
  decimals?: number;
}

export interface BridgeSupportedChain {
  chainId: number;
  chainName: string;
  supportedTokens: BridgeSupportedToken[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export const ROPSTEN_CHAIN_DETAILS: BridgeSupportedChain = {
  chainName: "Ropsten",
  chainId: 3,
  supportedTokens: [
    {
      name: "Token",
      symbol: "TKN",
      address: "0x5Cc946eF9A9838c10Ff87d069f34827ED4b5392D",
    },
  ],
  nativeCurrency: {
    name: "Ropsten Ether",
    symbol: "ROP",
    decimals: 18,
  },
  rpcUrls: ["https://ropsten.infura.io/v3/b595186473804e4b98e02d72d1bfe124"],
  blockExplorerUrls: ["https://ropsten.etherscan.io"],
};

export const RINKEBY_CHAIN_DETAILS: BridgeSupportedChain = {
  chainName: "Rinkeby",
  chainId: 4,
  supportedTokens: [
    {
      name: "Token",
      symbol: "TKN",
      address: "0xe999b06Fba9e0D7FB2Cd12817c9E0a36363B376E",
    },
    {
      name: "Tether USDT",
      symbol: "USDT",
      address: "0xa1Cba00d6e99f52B8cb5f867a6f2db0F3ad62276",
    },
  ],
  nativeCurrency: {
    name: "Rinkeby Ether",
    symbol: "RIN",
    decimals: 18,
  },
  rpcUrls: ["https://rinkeby.infura.io/v3/b2112748692f4ca38df9a3c33ddd02e8"],
  blockExplorerUrls: ["https://rinkeby.etherscan.io"],
};

export const bridgeSupportedChains: BridgeSupportedChain[] = [
  ROPSTEN_CHAIN_DETAILS,
  RINKEBY_CHAIN_DETAILS,
];
