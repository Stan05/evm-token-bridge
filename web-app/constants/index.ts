
  export interface Networks {
    [key: number]: string;
  }
  export const walletConnectSupportedNetworks: Networks = {
    // Add your network rpc URL here
    1: "https://ethereumnode.defiterm.io",
    3: "https://ethereumnode.defiterm-dev.net"
  };

  // Network chain ids
  const MAINNET_ID = 1;
  const ROPSTEN_ID = 3;
  const RINKEBY_ID = 4;
  export const supportedMetamaskNetworks = [MAINNET_ID, ROPSTEN_ID, RINKEBY_ID];

  // Contract Names
  const FEE_CALCULATOR = "FeeCalculator";

  // Mainnet Addreses
  const MAINNET_ADDRESSES: Map<string, string> = new Map();
  
  // Rinkeby Addreses
  const ROPSTEN_ADDRESSES: Map<string, string> = new Map();
  ROPSTEN_ADDRESSES.set(FEE_CALCULATOR, "0xBFB3d5592386dDD098b783e649B73F2838A931F7");

  // Rinkeby Addreses
  const RINKEBY_ADDRESSES: Map<string, string> = new Map();
  RINKEBY_ADDRESSES.set(FEE_CALCULATOR, "0x8D561810f9F61bCD84D83bf4181AF3A26e503B56");

  // All Addresses
  export const CONTRACT_ADDRESSES: Map<number, Map<string, string>> = new Map();
  CONTRACT_ADDRESSES.set(MAINNET_ID, MAINNET_ADDRESSES);
  CONTRACT_ADDRESSES.set(ROPSTEN_ID, ROPSTEN_ADDRESSES);
  CONTRACT_ADDRESSES.set(RINKEBY_ID, RINKEBY_ADDRESSES);
  
  export const FEE_CALCULATOR_ADDRESS = "0xc6869a93ef55e1d8ec8fdcda89c9d93616cf0a72";
  export const US_ELECTION_ADDRESS = "0xA09fF4F39FD8553051ABf0188100b7C5A6dc5452";