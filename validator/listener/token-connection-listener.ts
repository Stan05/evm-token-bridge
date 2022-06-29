import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import RegistryABI from "../abis/Registry.json";
import ERC20ABI from "../abis/ERC20Token.json";
import SupportedTokenService from "../service/supported-token-service";
dotenv.config();

/* SOURCE CHAIN DEFS */
const sourceChainProvider: StaticJsonRpcProvider =
  new ethers.providers.StaticJsonRpcProvider(
    process.env.RINKEBY_URL?.toString() ?? ""
  );

const sourceRegistryContractAddress: string =
  process.env.RINKEBY_REGISTRY_CONTRACT_ADDR?.toString() ?? "";
const sourceRegistryContract: Contract = new ethers.Contract(
  sourceRegistryContractAddress,
  RegistryABI.abi,
  sourceChainProvider
);

/* TARGET CHAIN DEFS */
const targetChainProvider: StaticJsonRpcProvider =
  new ethers.providers.StaticJsonRpcProvider(
    process.env.ROPSTEN_URL?.toString() ?? ""
  );
const targetRegistryContractAddress: string =
  process.env.ROPSTEN_REGISTRY_CONTRACT_ADDR?.toString() ?? "";
const targetRegistryContract: Contract = new ethers.Contract(
  targetRegistryContractAddress,
  RegistryABI.abi,
  targetChainProvider
);

const supportedTokenService: SupportedTokenService =
  new SupportedTokenService();

const handleTokenConnectionRegistered = async (
  event: any,
  chainProvider: StaticJsonRpcProvider
): Promise<void> => {
  console.log(event.data);
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    ["uint16", "uint16"],
    event.data
  );
  const sourceToken: string = ethers.utils.hexStripZeros(event.topics[1]);
  const targetToken: string = ethers.utils.hexStripZeros(event.topics[2]);
  const sourceChainId: number = decodedData[0];
  const targetChainId: number = decodedData[1];
  console.log(
    "Received source token %s from chain %d connection to target token %s on chain %d",
    sourceToken,
    sourceChainId,
    targetToken,
    targetChainId
  );

  await supportedTokenService.EnsureTokenIsSupported(
    sourceChainId,
    sourceToken
  );
  await supportedTokenService.EnsureTokenIsSupported(
    targetChainId,
    targetToken
  );
};

const listenForTokenConnections = async () => {
  sourceChainProvider.on(
    sourceRegistryContract.filters.TokenConnectionRegistered(),
    (event) => handleTokenConnectionRegistered(event, sourceChainProvider)
  );
  targetChainProvider.on(
    targetRegistryContract.filters.TokenConnectionRegistered(),
    (event) => handleTokenConnectionRegistered(event, targetChainProvider)
  );
};

export default listenForTokenConnections;
