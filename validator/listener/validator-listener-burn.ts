import dotenv from "dotenv";
import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import BridgeABI from "../abis/Bridge.json";
import GovernanceABI from "../abis/Governance.json";
import RegistryABI from "../abis/Registry.json";
import TransactionRepository from "../repository/transaction-repository";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../repository/models/transaction";
import { getValidatorAllowanceSignature, ensureFinality } from "./utils";
import TransactionService from "../service/transaction-service";
import { networks } from "../config";
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

const validatorTargetChainWallet: Wallet = new ethers.Wallet(
  validatorPrivateKey,
  targetChainProvider
);
const transactionService: TransactionService = new TransactionService();

const handleBurnEvent = async (
  event: any,
  sourceChainId: number,
  targetChainId: number,
  targetChainProvider: StaticJsonRpcProvider,
  sourceChainProvider: StaticJsonRpcProvider,
  targetBridgeContract: Contract,
  sourceRegistryContract: Contract,
  validatorSourceChainWallet: Wallet
) => {
  console.log("--------------Burn Event--------------");
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    ["address", "uint256"],
    event.data
  );
  const from: string = ethers.utils.hexStripZeros(event.topics[1]);
  const eventTargetChainId: number = parseInt(event.topics[2]);
  const burnToken: string = decodedData[0];
  const burnAmount: BigNumber = decodedData[1];
  if (
    targetChainId === eventTargetChainId &&
    (await transactionService.GetBridgeTransaction(
      event.transactionHash,
      TransactionType.BURN,
      sourceChainId,
      targetChainId
    )) == null
  ) {
    const transaction: Transaction = {
      bridgeTxHash: event.transactionHash,
      txType: TransactionType.BURN,
      txStatus: TransactionStatus.WAITING_FINALITY,
      from: from,
      targetChainid: targetChainId,
      sourceChainId: sourceChainId,
      amount: burnAmount,
      sourceToken: burnToken,
      targetToken: "N/A",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await transactionService.CreateTransaction(transaction);

    if (!(await ensureFinality(sourceChainProvider, event.transactionHash))) {
      console.log("Transaction was reverted, not going to process the event");
      transaction.txStatus = TransactionStatus.FAILED;
      transaction.updatedAt = new Date();
      await transactionService.UpdateTransaction(transaction);
      return;
    }

    const sourceToken: string =
      await sourceRegistryContract.lookupSourceTokenAddress(
        burnToken,
        targetChainId
      );

    const governance: Contract = new ethers.Contract(
      await targetBridgeContract.governance(),
      GovernanceABI.abi,
      targetChainProvider
    );
    const signature = await getValidatorAllowanceSignature(
      validatorSourceChainWallet,
      targetChainProvider,
      from,
      burnAmount,
      sourceToken,
      governance
    );
    transaction.signatures = [signature];
    transaction.txStatus = TransactionStatus.WAITING_CLAIM;
    transaction.updatedAt = new Date();
    transaction.targetToken = sourceToken;
    await transactionService.UpdateTransaction(transaction);
  } else {
    console.log(
      "Received Event that already has an entry ",
      event.transactionHash
    );
  }
};

const listenForBurnEvents = async () => {
  sourceChainProvider.on(sourceBridgeContract.filters.Burn(), (event) =>
    handleBurnEvent(
      event,
      4,
      3,
      targetChainProvider,
      sourceChainProvider,
      targetBridgeContract,
      targetRegistryContract,
      validatorSourceChainWallet
    )
  );
  targetChainProvider.on(targetBridgeContract.filters.Burn(), (event) =>
    handleBurnEvent(
      event,
      3,
      4,
      sourceChainProvider,
      targetChainProvider,
      sourceBridgeContract,
      sourceRegistryContract,
      validatorTargetChainWallet
    )
  );
};
export default listenForBurnEvents;
