import { ethers, waffle } from "hardhat";
import { BigNumber, Contract, ContractFactory, Signer } from "ethers";
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
        .to.emit(registry, 'TargetTokenRegistered');
    expect(await registry.lookupTargetTokenAddress(sourceToken, targetChainId))
        .to.equal(targetToken);
  });

});