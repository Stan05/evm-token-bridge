import { bridgeSupportedChains } from "./networks";

export interface Networks {
  [key: number]: string;
}
export const walletConnectSupportedNetworks: Networks = {
  // Add your network rpc URL here
  1: "https://ethereumnode.defiterm.io",
  3: "https://ethereumnode.defiterm-dev.net",
};
export const supportedMetamaskNetworks = bridgeSupportedChains.map(
  (chain) => chain.chainId
);

// Network chain ids
export const ROPSTEN_ID: number = bridgeSupportedChains.find(
  (chain) => chain.chainName === "Ropsten"
).chainId;
export const RINKEBY_ID: number = bridgeSupportedChains.find(
  (chain) => chain.chainName === "Rinkeby"
).chainId;

// Contract Names
export const FEE_CALCULATOR: string = "FeeCalculator";
export const REGISTRY: string = "Registry";
export const BRIDGE: string = "Bridge";
export const WRAPPED_TOKEN_FACTORY: string = "WrappedTokenFactory";

// Rinkeby Addreses
const ROPSTEN_ADDRESSES: Map<string, string> = new Map();
ROPSTEN_ADDRESSES.set(
  FEE_CALCULATOR,
  "0x12d4C5C7d5165E7D11E03cA93986E3b9336A52eb"
);
ROPSTEN_ADDRESSES.set(BRIDGE, "0x50926F29B9BCC0274E02d03ae9D812CdFe537BAe");
ROPSTEN_ADDRESSES.set(REGISTRY, "0xCcfAFc8b4867fe4939Df58c76c2E9242bAC71199");
ROPSTEN_ADDRESSES.set(
  WRAPPED_TOKEN_FACTORY,
  "0x7517a0368DF53F579377545D938CC14e99A92022"
);

// Rinkeby Addreses
const RINKEBY_ADDRESSES: Map<string, string> = new Map();
RINKEBY_ADDRESSES.set(
  FEE_CALCULATOR,
  "0x8EcD89d1119E1b623B6dE257BC42F384F29748a8"
);
RINKEBY_ADDRESSES.set(REGISTRY, "0xB77560E157e82e27DA4846db02D011672F7B0C06");
RINKEBY_ADDRESSES.set(BRIDGE, "0xea1ed89D447F8D12988253421B4959f0E81C910b");
RINKEBY_ADDRESSES.set(
  WRAPPED_TOKEN_FACTORY,
  "0xf3543D3026565a99b6Bc52d20920c3b364320736"
);

// All Addresses
export const CONTRACTS_ADDRESSES: Map<number, Map<string, string>> = new Map();
CONTRACTS_ADDRESSES.set(ROPSTEN_ID, ROPSTEN_ADDRESSES);
CONTRACTS_ADDRESSES.set(RINKEBY_ID, RINKEBY_ADDRESSES);
