import { Contract, Wallet } from "ethers";
import { expect } from "chai";
import { deployContract, MockProvider } from "ethereum-waffle";
import GovernanceABI from "../artifacts/contracts/Governance.sol/Governance.json";

describe("Governance", function () {
  let provider: MockProvider;
  let governance: Contract;
  let validator: Wallet;
  let validator2: Wallet;
  let user: Wallet;
  let deployer: Wallet;

  before(async function () {
    provider = new MockProvider();
    [deployer, user, validator, validator2] = provider.getWallets();  
  });

  it("Should register validators on deploy", async function () {
    governance = await deployContract(deployer, GovernanceABI, [[validator.address]]); 
    
    expect(await governance.hasAccess(validator.getAddress())).to.be.true;
  });

  it("Should register validator", async function () {
    await expect(governance.registerValidator(validator2.address))
      .to.emit(governance, 'ValidatorRegistered')
      .withArgs(validator2.address);

    expect(await governance.hasAccess(validator2.address)).to.be.true;
    expect(await governance.hasAccess(user.address)).to.be.false;
  });
  
  it("Should unregister validator", async function () {    
    await expect(governance.unRegisterValidator(validator2.address))
      .to.emit(governance, 'ValidatorUnRegistered')
      .withArgs(validator2.address);

    expect(await governance.hasAccess(validator2.address))
      .to.be.false;
  });
});