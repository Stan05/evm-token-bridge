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
  "0xC139a372F53bf3036d41D6D7E1E997f933d908Ed"
);
ROPSTEN_ADDRESSES.set(BRIDGE, "0xD52bc80cB000Ccc5DB22328e5247b0ad2Be88F1d");
ROPSTEN_ADDRESSES.set(REGISTRY, "0x42a3416255921B06767819E68037180d9bcC582C");
ROPSTEN_ADDRESSES.set(
  WRAPPED_TOKEN_FACTORY,
  "0x9394F080fA3C9BD5d02BEdb6C7EbD6A7DCE10184"
);

// Rinkeby Addreses
const RINKEBY_ADDRESSES: Map<string, string> = new Map();
RINKEBY_ADDRESSES.set(
  FEE_CALCULATOR,
  "0x7D65aDfF2E7c224B6c96865D7d9C6d86B4f75E9E"
);
RINKEBY_ADDRESSES.set(REGISTRY, "0x7312b86d684fAdE7B33531323bec0C0EBADFfD20");
RINKEBY_ADDRESSES.set(BRIDGE, "0x3DE54C0044571a5e137ee5C1B6c5Ef049B58bD83");
RINKEBY_ADDRESSES.set(
  WRAPPED_TOKEN_FACTORY,
  "0x0215E90686aa599D00AA0CbC4c953e6DC6BF91c3"
);

// All Addresses
export const CONTRACTS_ADDRESSES: Map<number, Map<string, string>> = new Map();
CONTRACTS_ADDRESSES.set(ROPSTEN_ID, ROPSTEN_ADDRESSES);
CONTRACTS_ADDRESSES.set(RINKEBY_ID, RINKEBY_ADDRESSES);
