import dotenv from "dotenv";
import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import BridgeABI from "../abis/Bridge.json";
import GovernanceABI from "../abis/Governance.json";
import RegistryABI from "../abis/Registry.json";
import ERC20ABI from "../abis/ERC20Token.json";
import ValidatorRepository from "../repository/validator-repository";
import { Transaction, TransactionType } from "../repository/models/transaction";
import { getValidatorAllowanceSignature } from "./utils";
dotenv.config();

const validatorPrivateKey: string =
  process.env.VALIDATOR_PRIVATE_KEY?.toString() ?? "";

/* SOURCE CHAIN DEFS */
const sourceChainProvider: StaticJsonRpcProvider =
  new ethers.providers.StaticJsonRpcProvider(
    process.env.ROPSTEN_URL?.toString() ?? ""
  );

const sourceBridgeContractAddress: string =
  process.env.ROPSTEN_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const sourceBridgeContract: Contract = new ethers.Contract(
  sourceBridgeContractAddress,
  BridgeABI.abi,
  sourceChainProvider
);

const sourceRegistryContractAddress: string =
  process.env.ROPSTEN_REGISTRY_CONTRACT_ADDR?.toString() ?? "";
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
    process.env.RINKEBY_URL?.toString() ?? ""
  );

const targetBridgeContractAddress: string =
  process.env.RINKEBY_URL?.toString() ?? "";
const targetBridgeContract: Contract = new ethers.Contract(
  targetBridgeContractAddress,
  BridgeABI.abi,
  targetChainProvider
);

const validatorRepository: ValidatorRepository = new ValidatorRepository();

const listenForBurnEvents = async () => {
  sourceChainProvider.on(sourceBridgeContract.filters.Burn(), handleBurnEvent);
};

const handleBurnEvent = async (event: any) => {
  if (
    (await validatorRepository.GetTransaction(
      event.transactionHash,
      TransactionType.BURN
    )) == null
  ) {
    console.log("--------------Burn Event--------------");
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      ["address", "uint256"],
      event.data
    );
    const from: string = ethers.utils.hexStripZeros(event.topics[1]);
    const targetChainId: number = parseInt(event.topics[2]);
    const burnToken: string = decodedData[0];
    const burnAmount: BigNumber = decodedData[1];
    console.log("Block Number :", event.blockNumber);
    console.log("From : ", from);
    console.log("Target chain id : ", targetChainId);
    console.log("Burnt Token : ", burnToken);
    console.log("Burnt Amount : ", burnAmount.toString());

    const sourceToken: string = await lookupSourceTokenAddress(
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
    const lockTransaction: Transaction = {
      txHash: event.transactionHash,
      txType: TransactionType.BURN,
      from: from,
      targetChainid: targetChainId,
      lockedAmount: burnAmount,
      lockedToken: burnToken,
      targetToken: sourceToken,
      signatures: [signature],
    };
    await validatorRepository.CreateTransaction(lockTransaction);
  }
};

const lookupSourceTokenAddress = async (
  targetToken: string,
  targetChainId: number
): Promise<string> => {
  return await sourceRegistryContract.lookupSourceTokenAddress(
    targetToken,
    targetChainId
  );
};
export default listenForBurnEvents;
