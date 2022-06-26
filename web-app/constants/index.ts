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
  "0xBFB3d5592386dDD098b783e649B73F2838A931F7"
);
ROPSTEN_ADDRESSES.set(BRIDGE, "0xc27C775C386e0f7D77E8148675aeac90746a40e5");
ROPSTEN_ADDRESSES.set(REGISTRY, "0x30e3333573f5887d49A7984A3ABFA0e8feB9e043");
ROPSTEN_ADDRESSES.set(
  WRAPPED_TOKEN_FACTORY,
  "0x9F3c766A48Bd725FB761b56380c8f6892b717E5f"
);

// Rinkeby Addreses
const RINKEBY_ADDRESSES: Map<string, string> = new Map();
RINKEBY_ADDRESSES.set(
  FEE_CALCULATOR,
  "0x8D561810f9F61bCD84D83bf4181AF3A26e503B56"
);
RINKEBY_ADDRESSES.set(REGISTRY, "0xc0FFa84775A3CE064d540B94637e22044f4AE4a4");
RINKEBY_ADDRESSES.set(BRIDGE, "0x180fC577b65B62A50dB5C9Ef84485ac3e4f89b9C");
RINKEBY_ADDRESSES.set(
  WRAPPED_TOKEN_FACTORY,
  "0x1dF9E3c9E9935D17c2d979982fB1a63c12036F01"
);

// All Addresses
export const CONTRACTS_ADDRESSES: Map<number, Map<string, string>> = new Map();
CONTRACTS_ADDRESSES.set(ROPSTEN_ID, ROPSTEN_ADDRESSES);
CONTRACTS_ADDRESSES.set(RINKEBY_ID, RINKEBY_ADDRESSES);
