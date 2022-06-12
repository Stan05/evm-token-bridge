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
    const validator: Signer = accounts[3];
    const randomUser: Signer = accounts[4];
    governance.registerValidator(validator.getAddress());

    expect(await governance.hasAccess(validator.getAddress())).to.be.true;
    expect(await governance.hasAccess(randomUser.getAddress())).to.be.false;
  });
  
  it("Should unregister validator", async function () {
    const validator: Signer = accounts[5];
   
    governance.registerValidator(validator.getAddress());
    expect(await governance.hasAccess(validator.getAddress())).to.be.true;
    
    governance.unRegisterValidator(validator.getAddress());
    expect(await governance.hasAccess(validator.getAddress())).to.be.false;
  });
});