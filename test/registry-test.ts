import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, Wallet } from "ethers";
import { expect } from "chai";
import { deployContract, MockProvider } from "ethereum-waffle";
import RegistryABI from "../artifacts/contracts/Registry.sol/Registry.json";

describe("Registry", function () {
  let provider: MockProvider;
  let registry: Contract;
  let accounts: Signer[];
  let deployer: Wallet;

  before(async function () {
    provider = new MockProvider();
    [deployer] = provider.getWallets();  
    registry = await deployContract(deployer, RegistryABI, []); 
    accounts = await ethers.getSigners();
  });

  it("Should register token connection", async function () {
    const sourceToken: string = await accounts[0].getAddress();
    const targetChainId: number = 2;
    const targetToken: string = await accounts[1].getAddress();
    
    await expect(registry.registerTargetTokenAddress(sourceToken, targetChainId, targetToken))
        .to.emit(registry, 'TokenConnectionRegistered')
        .withArgs(sourceToken, targetToken, 1, targetChainId);
    expect(await registry.lookupTargetTokenAddress(sourceToken, targetChainId))
        .to.equal(targetToken);
    expect(await registry.lookupSourceTokenAddress(targetToken, 1))
        .to.equal(sourceToken);
  });

  it("Should not allow register of source token pointing to zero address", async () => {
    const sourceToken: string = ethers.constants.AddressZero;
    const targetChainId: number = 2;
    const targetToken: string = await accounts[1].getAddress();

    await expect(registry.registerTargetTokenAddress(sourceToken, targetChainId, targetToken))
        .to.be.revertedWith('Invalid source address');
  })

  it("Should not allow register of target token pointing to zero address",async () => {
    const sourceToken: string = await accounts[0].getAddress();
    const targetChainId: number = 2;
    const targetToken: string = ethers.constants.AddressZero;

    await expect(registry.registerTargetTokenAddress(sourceToken, targetChainId, targetToken))
        .to.be.revertedWith('Invalid target address');
  })
});