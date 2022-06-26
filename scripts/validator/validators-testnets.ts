import "dotenv/config";
import { ethers } from "hardhat";
import { BigNumber, BytesLike, Contract, Wallet } from "ethers";
import hre from "hardhat";
import BridgeABI from "../../artifacts/contracts/Bridge.sol/Bridge.json";
import RegistryABI from "../../artifacts/contracts/Registry.sol/Registry.json";
import ERC20ABI from "../../artifacts/contracts/ERC20Token.sol/ERC20Token.json";
import GovernanceABI from "../../artifacts/contracts/Governance.sol/Governance.json";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { getValidatorAllowanceSignature } from "../helper/validator-functions";

const sourceBridgeContractAddress: string =
  process.env.RINKEBY_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const targetBridgeContractAddress: string =
  process.env.ROPSTEN_BRIDGE_CONTRACT_ADDR?.toString() ?? "";
const sourceRegistryContractAddress: string =
  process.env.RINKEBY_REGISTRY_CONTRACT_ADDR?.toString() ?? "";

const validatorPrivateKey: string =
  process.env.VALIDATOR_PRIVATE_KEY?.toString() ?? "";
const sourceDeployerPrivateKey: string =
  process.env.DEPLOYER_PRIVATE_KEY?.toString() ?? "";
const targetDeployerPrivateKey: string =
  process.env.DEPLOYER_PRIVATE_KEY?.toString() ?? "";

const sourceChainProvider: StaticJsonRpcProvider =
  new hre.ethers.providers.StaticJsonRpcProvider(
    process.env.RINKEBY_URL?.toString() ?? ""
  );
const targetChainProvider: StaticJsonRpcProvider =
  new hre.ethers.providers.StaticJsonRpcProvider(
    process.env.ROPSTEN_URL?.toString() ?? ""
  );

const validatorSourceChainWallet: Wallet = new hre.ethers.Wallet(
  validatorPrivateKey,
  sourceChainProvider
);
const validatorTargetChainWallet: Wallet = new hre.ethers.Wallet(
  validatorPrivateKey,
  targetChainProvider
);

const sourceDeployer: Wallet = new hre.ethers.Wallet(
  sourceDeployerPrivateKey,
  sourceChainProvider
);
const targetDeployer: Wallet = new hre.ethers.Wallet(
  targetDeployerPrivateKey,
  targetChainProvider
);

const sourceBridgeContract: Contract = new hre.ethers.Contract(
  sourceBridgeContractAddress,
  BridgeABI.abi,
  sourceChainProvider
);
const targetBridgeContract: Contract = new hre.ethers.Contract(
  targetBridgeContractAddress,
  BridgeABI.abi,
  targetChainProvider
);

const sourceRegistryContract: Contract = new hre.ethers.Contract(
  sourceRegistryContractAddress,
  RegistryABI.abi,
  sourceChainProvider
);

async function main() {
  sourceChainProvider.on(sourceBridgeContract.filters.Lock(), handleLockEvent);
  targetChainProvider.on(targetBridgeContract.filters.Mint(), handleMintEvent);

  targetChainProvider.on(targetBridgeContract.filters.Burn(), handleBurnEvent);
  sourceChainProvider.on(
    sourceBridgeContract.filters.Release(),
    handleReleaseEvent
  );
}

const handleLockEvent = async (event: {
  data: any;
  topics: string[];
  blockNumber: any;
}) => {
  console.log("--------------Lock Event--------------");
  const decodedData = hre.ethers.utils.defaultAbiCoder.decode(
    ["address", "uint256"],
    event.data
  );
  const from = hre.ethers.utils.hexStripZeros(event.topics[1]);
  const lockedToken: string = decodedData[0];
  const lockedAmount: BigNumber = decodedData[1];
  const targetChainId: number = parseInt(event.topics[2]);
  console.log("Block Number :", event.blockNumber);
  console.log("From : ", from);
  console.log("Target chain id : ", targetChainId);
  console.log("Locked Token : ", lockedToken);
  console.log("Locked Amount : ", lockedAmount.toString());
  await logNewBalance(lockedToken, from, sourceChainProvider);

  const targetToken: string = await lookupTargetWrappedTokenAddress(
    lockedToken,
    targetChainId
  );
  if (targetToken !== ethers.constants.AddressZero) {
    const governance: Contract = new hre.ethers.Contract(
      await targetBridgeContract.governance(),
      GovernanceABI.abi,
      targetChainProvider
    );
    console.log(
      "Validators's signature %s\n",
      await getValidatorAllowanceSignature(
        validatorTargetChainWallet,
        targetChainProvider,
        from,
        lockedAmount,
        targetToken,
        governance
      )
    );
  }
};

const handleMintEvent = async (event: {
  topics: any[];
  data: any;
  blockNumber: any;
}) => {
  console.log("--------------Mint Event--------------");
  const receiver = ethers.utils.hexStripZeros(event.topics[1]);
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    ["address", "uint256"],
    event.data
  );
  const mintToken = decodedData[0];
  const mintAmount = decodedData[1];
  console.log("Block Number :", event.blockNumber);
  console.log("Receiver : ", receiver);
  console.log("Mint Wrapped Token : ", mintToken);
  console.log("Mint Amount : ", mintAmount.toString());
  await logNewBalance(mintToken, receiver, targetChainProvider);
};

const handleBurnEvent = async (event: {
  data: BytesLike;
  topics: string[];
  blockNumber: any;
}) => {
  console.log("--------------Burn Event--------------");
  const decodedData = hre.ethers.utils.defaultAbiCoder.decode(
    ["address", "uint256"],
    event.data
  );
  const from: string = hre.ethers.utils.hexStripZeros(event.topics[1]);
  const targetChainId: number = parseInt(event.topics[2]);
  const burnToken: string = decodedData[0];
  const burnAmount: BigNumber = decodedData[1];
  console.log("Block Number :", event.blockNumber);
  console.log("From : ", from);
  console.log("Target chain id : ", targetChainId);
  console.log("Burnt Token : ", burnToken);
  console.log("Burnt Amount : ", burnAmount.toString());
  await logNewBalance(burnToken, from, targetChainProvider);

  const sourceToken: string = await lookupSourceTokenAddress(
    burnToken,
    targetChainId
  );

  const governance: Contract = new hre.ethers.Contract(
    await targetBridgeContract.governance(),
    GovernanceABI.abi,
    sourceChainProvider
  );
  console.log(
    "Validators's signature %s\n",
    await getValidatorAllowanceSignature(
      validatorSourceChainWallet,
      sourceChainProvider,
      from,
      burnAmount,
      sourceToken,
      governance
    )
  );
};

const handleReleaseEvent = async (event: any) => {
  console.log("--------------Release Event--------------");
  const receiver = ethers.utils.hexStripZeros(event.topics[1]);
  const decodedData = ethers.utils.defaultAbiCoder.decode(
    ["address", "uint256"],
    event.data
  );
  const releasedToken = decodedData[0];
  const releasedAmount = decodedData[1];
  console.log("Block Number :", event.blockNumber);
  console.log("Receiver : ", receiver);
  console.log("Released Token : ", releasedToken);
  console.log("Released Amount : ", releasedAmount.toString());
  await logNewBalance(releasedToken, receiver, sourceChainProvider);
};

const deployWrappedTokenOnTargetChain = async (
  sourceToken: string
): Promise<string> => {
  const sourceTokenContract = new hre.ethers.Contract(
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

const lookupTargetWrappedTokenAddress = async (
  sourceToken: string,
  targetChainId: number
): Promise<string> => {
  let targetWrappedTokenAddress =
    await sourceRegistryContract.lookupTargetTokenAddress(
      sourceToken,
      targetChainId
    );
  if (
    targetWrappedTokenAddress == undefined ||
    targetWrappedTokenAddress == ethers.constants.AddressZero
  ) {
    console.log("\nDoesn't have corresponding wrapped token, deploying one");
    targetWrappedTokenAddress = await deployWrappedTokenOnTargetChain(
      sourceToken
    );
    await sourceRegistryContract
      .connect(sourceDeployer)
      .registerTargetTokenAddress(
        sourceToken,
        targetChainId,
        targetWrappedTokenAddress
      );
  }
  return targetWrappedTokenAddress;
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

main();

async function logNewBalance(
  tokenAddress: string,
  userAddress: string,
  chainProvider: StaticJsonRpcProvider
) {
  const mintTokenContract = new hre.ethers.Contract(
    tokenAddress,
    ERC20ABI.abi,
    chainProvider
  );
  const tokenName = await mintTokenContract.name();
  const newBalance = (
    await mintTokenContract.balanceOf(userAddress)
  ).toString();

  console.log(
    "User's %s new balance of '%s' is %d .\n",
    userAddress,
    tokenName,
    newBalance
  );
}
