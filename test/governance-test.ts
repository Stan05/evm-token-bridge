import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory, Signer } from "ethers";
import { expect } from "chai";

describe("Governance", function () {
  let accounts: Signer[];
  let governance: Contract;

  beforeEach(async function () {
    const governanceFactory: ContractFactory = await ethers.getContractFactory("Governance");
    accounts = await ethers.getSigners();
    governance = await governanceFactory.deploy();
    await governance.deployed();
  });

  
  it("Should register validator", async function () {
    const validator: Signer = accounts[1];
    const randomUser: Signer = accounts[2];
    governance.registerValidator(validator.getAddress());

    expect(await governance.hasAccess(validator.getAddress())).to.be.true;
    expect(await governance.hasAccess(randomUser.getAddress())).to.be.false;
  });
  
  it("Should unregister validator", async function () {
    const validator: Signer = accounts[1];
   
    governance.registerValidator(validator.getAddress());
    expect(await governance.hasAccess(validator.getAddress())).to.be.true;
    
    governance.unRegisterValidator(validator.getAddress());
    expect(await governance.hasAccess(validator.getAddress())).to.be.false;
  });

});