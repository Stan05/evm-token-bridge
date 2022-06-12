import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

async function deployBridge() {
    const bridgeContractName = "Bridge";
    const registryContractName = "Registry";
    const [deployer, validator] = await ethers.getSigners();
    
    console.log("\n-------------------------------------------------\n");
    const bridgeContractAddress = await deployContract(bridgeContractName, deployer, [validator.address]);
    const registryContractAddress = await deployContract(registryContractName, deployer)
    console.log("\n-------------------------------------------------\n");
    return [bridgeContractAddress, registryContractAddress]
}

const deployContract =async (contractName: string, deployer: SignerWithAddress, args?: any): Promise<string> => {
    console.log('Deploying contract %s with the account: %s', contractName, deployer.address);

    const ContractFactory = await ethers.getContractFactory(contractName);
    let contract;
    if (args) {
        contract = await ContractFactory.deploy(args);
    } else {
        contract = await ContractFactory.deploy();
    }
    console.log('Waiting for deployment... ');
    await contract.deployed();
    console.log('%s Contract deployed on address: %s', contractName, contract.address);

    return contract.address;
}
  
module.exports = deployBridge;

