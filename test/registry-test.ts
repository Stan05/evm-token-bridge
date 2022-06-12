import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { expect } from "chai";

describe("Registry", function () {
  let accounts: Signer[];
  let registry: Contract;

  beforeEach(async function () {
    const registryFactory: ContractFactory = await ethers.getContractFactory("Registry");
    accounts = await ethers.getSigners();
    registry = await registryFactory.deploy();
    await registry.deployed();
  });

  it("Should register target token address", async function () {
    const sourceToken: string = await accounts[0].getAddress();
    const targetChainId: number = 2;
    const targetToken: string = await accounts[1].getAddress();
    
    await expect(registry.registerTargetTokenAddress(sourceToken, targetChainId, targetToken))
        .to.emit(registry, 'TargetTokenRegistered')
        .withArgs(sourceToken, targetChainId, targetToken);
    expect(await registry.lookupTargetTokenAddress(sourceToken, targetChainId))
        .to.equal(targetToken);
  });

  it("Should not allow register of source token pointing to zero address",async () => {
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