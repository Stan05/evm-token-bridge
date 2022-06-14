import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, Wallet } from "ethers";
import { expect } from "chai";
import BridgeABI from "../artifacts/contracts/Bridge.sol/Bridge.json";
import ERC20TokenABI from "../artifacts/contracts/ERC20Token.sol/ERC20Token.json";
import GoverananceABI from "../artifacts/contracts/Governance.sol/Governance.json";
import TokenFactoryABI from "../artifacts/contracts//TokenFactory.sol/TokenFactory.json";
import { getUserPermit, getValidatorAllowanceSignature, getValidatorTokenCreationSignature } from "./helper/helper-functions";
import { deployContract, link, MockProvider } from "ethereum-waffle";

describe("Bridge", function () {
  let provider: MockProvider;
  let erc20Token: Contract;
  let user: Wallet;
  let owner: Wallet;
  let deployer: Wallet;

  before(async function () {
    provider = new MockProvider();
    [deployer, owner, user] = provider.getWallets();   
  });

  it('Should deploy and transfer ownership', async () => {
    erc20Token = await deployContract(deployer, ERC20TokenABI, ["Token", "TKN", owner.address]); 
    expect(await erc20Token.owner()).to.equal(owner.address);
  });

  it('Should mint', async () => {    
    const amount: number = 50;
    await expect(() => erc20Token.connect(owner).mint(user.address, amount))
        .to.changeTokenBalance(erc20Token, user, amount);
  });

  it('Should not allow mint', async () => {    
    const amount: number = 50;
    await expect(erc20Token.connect(deployer).mint(user.address, amount))
        .to.be.revertedWith('Ownable: caller is not the owner')
  });
});
