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
      name: "BridgeChainLink Token",
      symbol: "bLINK",
      address: "0xfd87e554d2c7587a605421b2e0f39868b0bfcf21",
    },
    {
      name: "Token",
      symbol: "TKN",
      address: "0x5Cc946eF9A9838c10Ff87d069f34827ED4b5392D",
    },
    /*{
      name: "Token",
      symbol: "TKN",
      address: "0x12E3Ed9De51B13E998AD57fa4881498C65A8BF38",
    },
    {
      name: "BridgeToken",
      symbol: "bTKN",
      address: "0x87731fDC857708b8974E28Aada134AA9affe9f85",
    },
    {
      name: "BridgeToken",
      symbol: "bTKN",
      address: "0xD64207051f469f660C624422c1B1d4a878b0373e",
    },*/
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
      name: "ChainLink Token",
      symbol: "LINK",
      address: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
    },
    /*{
      name: "Token1",
      symbol: "TKN",
      address: "0xe999b06Fba9e0D7FB2Cd12817c9E0a36363B376E",
    },*/
    {
      name: "Token",
      symbol: "TKN",
      address: "0x26aDCc1ec934f33423F2094Fbe9a07defB03E9f2",
    },
    /*{
      name: "BridgeToken",
      symbol: "bTKN",
      address: "0xf1cfEf6a33130500F3E450e208914A16EF3261C9",
    },
    {
      name: "LatestBridgeToken",
      symbol: "bTKN",
      address: "0x7Fc0C9550577441f9e1985b1d9b55E3626912dD4",
    },*/
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
