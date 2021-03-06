import "dotenv/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, Wallet } from "ethers";
import { ethers } from "hardhat";
import hre from "hardhat";

async function setup(verifyContract: boolean) {
  const validatorAddress: string = process.env.VALIDATOR_ADDR?.toString() ?? "";
  const serviceFee: BigNumber = ethers.utils.parseEther(
    process.env.BRIDGE_SERVICE_FEE?.toString() ?? "0.005"
  );

  const bridgeContractName: string = "Bridge";
  const registryContractName: string = "Registry";
  const governanceContractName: string = "Governance";
  const wrappedTokenFactoryContractName: string = "WrappedTokenFactory";
  const erc20TokenContractName: string = "ERC20Token";
  const feeCalculatorContractName: string = "FeeCalculator";
  const [deployer]: SignerWithAddress[] = await ethers.getSigners();

  console.log(
    "Deployer ether balance ",
    ethers.utils.formatEther(await deployer.getBalance())
  );
  const governance: Contract = await deployContract(
    governanceContractName,
    deployer,
    verifyContract,
    [validatorAddress]
  );
  const wrappedTokenFactory: Contract = await deployContract(
    wrappedTokenFactoryContractName,
    deployer,
    verifyContract
  );
  const feeCalculator: Contract = await deployContract(
    feeCalculatorContractName,
    deployer,
    verifyContract,
    serviceFee
  );
  const bridge: Contract = await deployContract(
    bridgeContractName,
    deployer,
    verifyContract,
    governance.address,
    wrappedTokenFactory.address,
    feeCalculator.address
  );
  const erc20Token: Contract = await deployContract(
    erc20TokenContractName,
    deployer,
    verifyContract,
    "Token",
    "TKN",
    deployer.address
  );
  const registry: Contract = await deployContract(
    registryContractName,
    deployer,
    verifyContract,
    governance.address
  );

  await governance.transferOwnership(bridge.address);
  await wrappedTokenFactory.transferOwnership(bridge.address);
  await feeCalculator.transferOwnership(bridge.address);

  console.log(
    "Deployer ether balance ",
    ethers.utils.formatEther(await deployer.getBalance())
  );
  return bridge;
}

const deployContract = async (
  contractName: string,
  deployer: SignerWithAddress,
  verifyContract: boolean,
  ...args: any
): Promise<Contract> => {
  console.log("\n-------------------------------------------------\n");
  console.log(
    "Deploying contract %s with the account: %s",
    contractName,
    deployer.address
  );

  const ContractFactory = await ethers.getContractFactory(contractName);

  let contract;
  if (args) {
    contract = await ContractFactory.deploy(...args);
  } else {
    contract = await ContractFactory.deploy();
  }

  console.log("Waiting for deployment... ");
  if (verifyContract) {
    console.log("Waiting 7 block confirmations");
    await contract.deployTransaction.wait(7);
    console.log(
      "%s Contract deployed on address: %s",
      contractName,
      contract.address
    );
    try {
      console.log("Starting verification");
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: [...args],
      });
      console.log("Contract Verified on Etherscan");
    } catch (error) {
      console.log(error);
    }
  } else {
    await contract.deployed();
    console.log(
      "%s Contract deployed on address: %s",
      contractName,
      contract.address
    );
  }

  console.log("\n-------------------------------------------------\n");
  return contract;
};

module.exports = setup;
