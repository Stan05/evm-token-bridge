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
        address: "0xea1ed89D447F8D12988253421B4959f0E81C910b",
      },
      {
        name: ContractName.REGISTRY,
        address: "0xB77560E157e82e27DA4846db02D011672F7B0C06",
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
        address: "0x50926F29B9BCC0274E02d03ae9D812CdFe537BAe",
      },
      {
        name: ContractName.REGISTRY,
        address: "0xCcfAFc8b4867fe4939Df58c76c2E9242bAC71199",
      },
    ],
    accounts: [process.env.VALIDATOR_PRIVATE_KEY?.toString()],
  },
];
