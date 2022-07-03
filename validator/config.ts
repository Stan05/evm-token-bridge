import dotenv from "dotenv";
dotenv.config();

export enum NetworkName {
  RINKEBY = "RINKEBY",
  ROPSTEN = "ROPSTEN",
}

export enum ContractName {
  BRIDGE = "BRIDGE",
  FEE_CALCULATOR = "FeeCalculator",
  REGISTRY = "Registry",
  GOVERNANCE = "Governance",
  WRAPPED_TOKEN_FACTORY = "WrappedTokenFactory",
  ERC20 = "ERC20",
  ERC20_TOKEN = "ERC20Token",
}

export interface NetworkConfig {
  name: NetworkName;
  chainId: number;
  url: string;
  contracts: ContractConfig[];
  accounts: (string | undefined)[];
}

export interface ContractConfig {
  name: ContractName;
  address: string;
}

export const networks: NetworkConfig[] = [
  {
    name: NetworkName.RINKEBY,
    chainId: 4,
    url: "https://rinkeby.infura.io/v3/b2112748692f4ca38df9a3c33ddd02e8",
    contracts: [
      {
        name: ContractName.BRIDGE,
        address: "0x3DE54C0044571a5e137ee5C1B6c5Ef049B58bD83",
      },
      {
        name: ContractName.REGISTRY,
        address: "0x7312b86d684fAdE7B33531323bec0C0EBADFfD20",
      },
    ],
    accounts: [process.env.VALIDATOR_PRIVATE_KEY?.toString()],
  },
  {
    name: NetworkName.ROPSTEN,
    chainId: 3,
    url: "https://ropsten.infura.io/v3/b595186473804e4b98e02d72d1bfe124",
    contracts: [
      {
        name: ContractName.BRIDGE,
        address: "0xD52bc80cB000Ccc5DB22328e5247b0ad2Be88F1d",
      },
      {
        name: ContractName.REGISTRY,
        address: "0x42a3416255921B06767819E68037180d9bcC582C",
      },
    ],
    accounts: [process.env.VALIDATOR_PRIVATE_KEY?.toString()],
  },
];
