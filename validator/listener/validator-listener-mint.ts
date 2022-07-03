import dotenv from "dotenv";
import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import BridgeABI from "../abis/Bridge.json";
import GovernanceABI from "../abis/Governance.json";
import RegistryABI from "../abis/Registry.json";
import ERC20ABI from "../abis/ERC20Token.json";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../repository/models/transaction";
import { getValidatorAllowanceSignature, ensureFinality } from "./utils";
import TransactionService from "../service/transaction-service";
dotenv.config();

const validatorPrivateKey: string =
  process.env.VALIDATOR_PRIVATE_KEY?.toString() ?? "";

/* SOURCE CHAIN DEFS */
const sourceChainProvider: StaticJsonRpcProvider =
  new ethers.providers.StaticJsonRpcProvider(
    process.env.RINKEBY_URL?.toString() ?? ""
  );

const sourceBridgeContractAddress: string =
  process.env.RINKEBY_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const sourceBridgeContract: Contract = new ethers.Contract(
  sourceBridgeContractAddress,
  BridgeABI.abi,
  sourceChainProvider
);

const sourceRegistryContractAddress: string =
  process.env.RINKEBY_REGISTRY_CONTRACT_ADDR?.toString() ?? "";
const sourceRegistryContract: Contract = new ethers.Contract(
  sourceRegistryContractAddress,
  RegistryABI.abi,
  sourceChainProvider
);

const validatorSourceChainWallet: Wallet = new ethers.Wallet(
  validatorPrivateKey,
  sourceChainProvider
);

/* TARGET CHAIN DEFS */
const targetChainProvider: StaticJsonRpcProvider =
  new ethers.providers.StaticJsonRpcProvider(
    process.env.ROPSTEN_URL?.toString() ?? ""
  );

const targetBridgeContractAddress: string =
  process.env.ROPSTEN_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const targetBridgeContract: Contract = new ethers.Contract(
  targetBridgeContractAddress,
  BridgeABI.abi,
  targetChainProvider
);
const targetRegistryContractAddress: string =
  process.env.ROPSTEN_REGISTRY_CONTRACT_ADDR?.toString() ?? "";
const targetRegistryContract: Contract = new ethers.Contract(
  targetRegistryContractAddress,
  RegistryABI.abi,
  targetChainProvider
);

const validatorWallet: Wallet = new ethers.Wallet(validatorPrivateKey);

const transactionService: TransactionService = new TransactionService();

const handleMintEvent = async (
  event: any,
  sourceChainId: number,
  targetChainId: number
) => {
  console.log("--------------Mint Event--------------");
  const receiver = ethers.utils.hexStripZeros(event.topics[1]);
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    ["address", "uint256"],
    event.data
  );
  const mintToken = decodedData[0];
  const mintAmount = decodedData[1];
  const transaction = await transactionService.GetClaimTransaction(
    event.transactionHash,
    TransactionType.BURN,
    targetChainId,
    sourceChainId
  );
  if (
    transaction != null &&
    transaction.txStatus === TransactionStatus.WAITING_CLAIM
  ) {
    console.log("Block Number :", event.blockNumber);
    console.log("Receiver : ", receiver);
    console.log("Mint Wrapped Token : ", mintToken);
    console.log("Mint Amount : ", mintAmount.toString());
  } else {
    console.log(
      "Transaction %s could not be found or the status was not WAITING_CLAIM",
      event.transactionHash
    );
  }
};

const listenForMintEvents = async () => {
  const sourceChainId = 4;
  const targetChainId = 3;
  sourceChainProvider.on(sourceBridgeContract.filters.Release(), (event) =>
    handleMintEvent(event, sourceChainId, targetChainId)
  );
  targetChainProvider.on(targetBridgeContract.filters.Release(), (event) =>
    handleMintEvent(event, targetChainId, sourceChainId)
  );
};

export default listenForMintEvents;
