export interface BridgeSupportedToken {
  name: string;
  symbol: string;
  token: string;
  decimals?: number;
}

export interface BridgeSupportedChain {
  chainId: number;
  chainName: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: 18;
  };
  rpcUrls?: string[];
  blockExplorerUrls?: string[];
}

export const ROPSTEN_CHAIN_DETAILS: BridgeSupportedChain = {
  chainName: "Ropsten",
  chainId: 3,
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
