import dotenv from "dotenv";
import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import BridgeABI from "../abis/Bridge.json";
import GovernanceABI from "../abis/Governance.json";
import RegistryABI from "../abis/Registry.json";
import ERC20ABI from "../abis/ERC20Token.json";
import { Transaction, TransactionType } from "../repository/models/transaction";
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

/**
 * Handles each Lock event emitted from the source chain Bridge contract.
 * Generates signature for the target chain to be used by the user.
 * Creates a new LockTransaction entry in the Repository.
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
  validatorTargetChainWallet: Wallet
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
    (await transactionService.GetTransaction(
      event.transactionHash,
      TransactionType.LOCK,
      sourceChainId,
      targetChainId
    )) == null
  ) {
    if (!(await ensureFinality(sourceChainProvider, event.transactionHash))) {
      console.log("Transaction was reverted, not going to process the event");
      return;
    }

    const targetToken: string = await lookupTargetWrappedTokenAddress(
      lockedToken,
      targetChainId,
      sourceRegistryContract,
      sourceChainProvider,
      targetBridgeContract,
      validatorTargetChainWallet
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
    const transaction: Transaction = {
      txHash: event.transactionHash,
      txType: TransactionType.LOCK,
      from: from,
      targetChainid: targetChainId,
      sourceChainId: sourceChainId,
      amount: lockedAmount,
      sourceToken: lockedToken,
      targetToken: targetToken,
      signatures: [signature],
    };
    await transactionService.CreateTransaction(transaction);
  } else {
    console.log(
      "Received Event that already has an entry ",
      event.transactionHash
    );
  }
}

/**
 * Lookup in the source Registry contract if we have a connection to the wrapped target token associated with
 * the given source token address and target chain id, if not deploys new wrapped token on target chain.
 * @param sourceToken the source token address
 * @param targetChainId the target chain id
 * @returns the wrapped token address on the target chain
 */
const lookupTargetWrappedTokenAddress = async (
  sourceToken: string,
  targetChainId: number,
  registryContract: Contract,
  sourceChainProvider: StaticJsonRpcProvider,
  targetBridgeContract: Contract,
  validatorTargetChainWallet: Wallet
): Promise<string> => {
  let targetWrappedTokenAddress =
    await registryContract.lookupTargetTokenAddress(sourceToken, targetChainId);
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
    await registryContract
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
 * Deploys new wrapped token on the target chain, that the user will claim
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

const listenForLockEvents = async () => {
  const sourceChainId = 4;
  const targetChainId = 3;
  sourceChainProvider.on(
    sourceBridgeContract.filters.Lock(null, targetChainId),
    (event) =>
      handleLockEvent(
        event,
        sourceChainId,
        targetChainId,
        sourceRegistryContract,
        targetBridgeContract,
        sourceChainProvider,
        targetChainProvider,
        validatorWallet.connect(targetChainProvider)
      )
  );
  targetChainProvider.on(
    targetBridgeContract.filters.Lock(null, sourceChainId),
    (event) =>
      handleLockEvent(
        event,
        targetChainId,
        sourceChainId,
        targetRegistryContract,
        sourceBridgeContract,
        targetChainProvider,
        sourceChainProvider,
        validatorWallet.connect(sourceChainProvider)
      )
  );
};

export default listenForLockEvents;
