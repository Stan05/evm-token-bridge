import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { expect } from "chai";

describe("Governance", function () {
  let accounts: Signer[];
  let governance: Contract;

  before(async function () {
    const governanceFactory: ContractFactory = await ethers.getContractFactory("Governance");
    accounts = await ethers.getSigners();
    governance = await governanceFactory.deploy("ContractName", []);
    await governance.deployed();
  });

  it("Should register validators on deploy", async function () {
    const validator: Signer = accounts[1];
    const validator2: Signer = accounts[2];

    const governanceFactory: ContractFactory = await ethers.getContractFactory("Governance");
    accounts = await ethers.getSigners();
    governance = await governanceFactory.deploy("ContractName", [validator.getAddress(), validator2.getAddress()]);
    await governance.deployed();
    
    expect(await governance.hasAccess(validator.getAddress())).to.be.true;
    expect(await governance.hasAccess(validator2.getAddress())).to.be.true;
  });

  it("Should register validator", async function () {
    const validatorAddress: string = await accounts[3].getAddress();
    const randomUserAddress: string = await accounts[4].getAddress();

    await expect(governance.registerValidator(validatorAddress))
      .to.emit(governance, 'ValidatorRegistered')
      .withArgs(validatorAddress);

    expect(await governance.hasAccess(validatorAddress)).to.be.true;
    expect(await governance.hasAccess(randomUserAddress)).to.be.false;
  });
  
  it("Should unregister validator", async function () {
    const validatorAddress: string = await accounts[5].getAddress();

    await expect(governance.registerValidator(validatorAddress))
      .to.emit(governance, 'ValidatorRegistered')
      .withArgs(validatorAddress);
    expect(await governance.hasAccess(validatorAddress))
      .to.be.true;
    
    await expect(governance.unRegisterValidator(validatorAddress))
      .to.emit(governance, 'ValidatorUnRegistered')
      .withArgs(validatorAddress);
    expect(await governance.hasAccess(validatorAddress))
      .to.be.false;
  });
});