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
const rinkebyChainProvider: StaticJsonRpcProvider =
  new ethers.providers.StaticJsonRpcProvider(
    process.env.RINKEBY_URL?.toString() ?? ""
  );

const rinkebyBridgeContractAddress: string =
  process.env.RINKEBY_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const rinkebyBridgeContract: Contract = new ethers.Contract(
  rinkebyBridgeContractAddress,
  BridgeABI.abi,
  rinkebyChainProvider
);

const rinkebyRegistryContractAddress: string =
  process.env.RINKEBY_REGISTRY_CONTRACT_ADDR?.toString() ?? "";
const rinkebyRegistryContract: Contract = new ethers.Contract(
  rinkebyRegistryContractAddress,
  RegistryABI.abi,
  rinkebyChainProvider
);

/* TARGET CHAIN DEFS */
const ropstenChainProvider: StaticJsonRpcProvider =
  new ethers.providers.StaticJsonRpcProvider(
    process.env.ROPSTEN_URL?.toString() ?? ""
  );

const ropstenBridgeContractAddress: string =
  process.env.ROPSTEN_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const ropstenBridgeContract: Contract = new ethers.Contract(
  ropstenBridgeContractAddress,
  BridgeABI.abi,
  ropstenChainProvider
);
const ropstenRegistryContractAddress: string =
  process.env.ROPSTEN_REGISTRY_CONTRACT_ADDR?.toString() ?? "";
const ropstenRegistryContract: Contract = new ethers.Contract(
  ropstenRegistryContractAddress,
  RegistryABI.abi,
  ropstenChainProvider
);

const validatorWallet: Wallet = new ethers.Wallet(validatorPrivateKey);

const transactionService: TransactionService = new TransactionService();

/**
 * Handles each Lock event emitted from the source chain Bridge contract.
 * Ensures the Lock transaction finality.
 * Manages the Transaction entry in the Repository at the different stages.
 * Generates signature for the target chain to be used by the user.
 *
 * @param event the Lock event data
 */
async function handleLockEvent(
  event: any,
  sourceChainId: number,
  targetChainId: number,
  sourceRegistryContract: Contract,
  targetBridgeContract: Contract,
  sourceChainProvider: StaticJsonRpcProvider,
  targetChainProvider: StaticJsonRpcProvider,
  validatorTargetChainWallet: Wallet,
  validatorSourceChainWallet: Wallet
) {
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    ["address", "uint256"],
    event.data
  );
  const from = ethers.utils.hexStripZeros(event.topics[1]);
  const lockedToken: string = decodedData[0];
  const lockedAmount: BigNumber = decodedData[1];
  const eventTargetChainId: number = parseInt(event.topics[2]);
  console.log(
    "Receiving event in source %d target %d handler",
    sourceChainId,
    targetChainId
  );
  if (
    eventTargetChainId === targetChainId &&
    (await transactionService.GetBridgeTransaction(
      event.transactionHash,
      TransactionType.LOCK,
      sourceChainId,
      targetChainId
    )) == null
  ) {
    const transaction: Transaction = {
      bridgeTxHash: event.transactionHash,
      txType: TransactionType.LOCK,
      txStatus: TransactionStatus.WAITING_FINALITY,
      from: from,
      targetChainid: targetChainId,
      sourceChainId: sourceChainId,
      amount: lockedAmount,
      sourceToken: lockedToken,
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

    const targetToken: string = await lookupTargetWrappedTokenAddress(
      lockedToken,
      targetChainId,
      sourceRegistryContract,
      sourceChainProvider,
      targetBridgeContract,
      validatorTargetChainWallet,
      validatorSourceChainWallet
    );
    const governance: Contract = new ethers.Contract(
      await targetBridgeContract.governance(),
      GovernanceABI.abi,
      targetChainProvider
    );
    const signature = await getValidatorAllowanceSignature(
      validatorTargetChainWallet,
      targetChainProvider,
      from,
      lockedAmount,
      targetToken,
      governance
    );

    transaction.signatures = [signature];
    transaction.txStatus = TransactionStatus.WAITING_CLAIM;
    transaction.updatedAt = new Date();
    transaction.targetToken = targetToken;
    await transactionService.UpdateTransaction(transaction);
  } else {
    console.log(
      "Received Event that already has an entry ",
      event.transactionHash
    );
  }
}

/**
 * Lookup in the source Registry contract if we have a connection to the wrapped target token associated with
 * the given source token address and target chain id, if not deploys new wrapped token on target chain
 * and register that connection in the source Registry contract.
 *
 * @param sourceToken the source token address
 * @param targetChainId the target chain id
 * @returns the wrapped token address on the target chain
 */
const lookupTargetWrappedTokenAddress = async (
  sourceToken: string,
  targetChainId: number,
  sourceRegistryContract: Contract,
  sourceChainProvider: StaticJsonRpcProvider,
  targetBridgeContract: Contract,
  validatorTargetChainWallet: Wallet,
  validatorSourceChainWallet: Wallet
): Promise<string> => {
  let targetWrappedTokenAddress =
    await sourceRegistryContract.lookupTargetTokenAddress(
      sourceToken,
      targetChainId
    );
  if (
    targetWrappedTokenAddress === undefined ||
    targetWrappedTokenAddress === ethers.constants.AddressZero
  ) {
    console.log("\nDoesn't have corresponding wrapped token, deploying one");
    targetWrappedTokenAddress = await deployWrappedTokenOnTargetChain(
      sourceToken,
      sourceChainProvider,
      targetBridgeContract,
      validatorTargetChainWallet
    );
    await sourceRegistryContract
      .connect(validatorSourceChainWallet) // TODO: Redeploy Registry and try this
      .registerTargetTokenAddress(
        sourceToken,
        targetChainId,
        targetWrappedTokenAddress
      );
  }
  return targetWrappedTokenAddress;
};

/**
 * Deploys new wrapped token on the target chain, that the user will claim.
 *
 * @param sourceToken the source token address, needed to fetch source token name and symbol
 * @returns the newly created wrapped token address
 */
const deployWrappedTokenOnTargetChain = async (
  sourceToken: string,
  sourceChainProvider: StaticJsonRpcProvider,
  targetBridgeContract: Contract,
  validatorTargetChainWallet: Wallet
): Promise<string> => {
  const sourceTokenContract: Contract = new ethers.Contract(
    sourceToken,
    ERC20ABI.abi,
    sourceChainProvider
  );
  const name = await sourceTokenContract.name();
  const symbol = await sourceTokenContract.symbol();

  const wrappedTokenAddressTx = await targetBridgeContract
    .connect(validatorTargetChainWallet)
    .createToken("Bridge" + name, "b" + symbol);
  const receipt = await wrappedTokenAddressTx.wait();

  const wrappedTokenAddress: string = ethers.utils.hexStripZeros(
    receipt.events[0].address
  );

  console.log(
    "Bridge token '%s' deployed on address: %s \n",
    "Bridge" + name,
    wrappedTokenAddress
  );

  return wrappedTokenAddress;
};

/**
 * Spin up two listeners for Lock events.
 * Rinkeby -> Ropsten.
 * Ropsten -> Rinkeby.
 */
const listenForLockEvents = async () => {
  const rinkebyChainId = 4;
  const ropstenChainId = 3;
  // Listen for Rinkeby -> Ropsten Lock tx
  rinkebyChainProvider.on(
    rinkebyBridgeContract.filters.Lock(null, ropstenChainId),
    (event) =>
      handleLockEvent(
        event,
        rinkebyChainId,
        ropstenChainId,
        rinkebyRegistryContract,
        ropstenBridgeContract,
        rinkebyChainProvider,
        ropstenChainProvider,
        validatorWallet.connect(ropstenChainProvider),
        validatorWallet.connect(rinkebyChainProvider)
      )
  );
  // Listen for Ropsten -> Rinkeby Lock tx
  ropstenChainProvider.on(
    ropstenBridgeContract.filters.Lock(null, rinkebyChainId),
    (event) =>
      handleLockEvent(
        event,
        ropstenChainId,
        rinkebyChainId,
        ropstenRegistryContract,
        rinkebyBridgeContract,
        ropstenChainProvider,
        rinkebyChainProvider,
        validatorWallet.connect(rinkebyChainProvider),
        validatorWallet.connect(ropstenChainProvider)
      )
  );
};

export default listenForLockEvents;
