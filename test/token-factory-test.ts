import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { expect } from "chai";

describe("TokenFactory", function () {
  let accounts: Signer[];
  let tokenFactoryContract: Contract;

  beforeEach(async function () {
    const tokenFactory: ContractFactory = await ethers.getContractFactory("TokenFactory");
    accounts = await ethers.getSigners();
    tokenFactoryContract = await tokenFactory.deploy();
    await tokenFactoryContract.deployed();
  });

  
  it('Should create new token and return it\'s address', async function () {
    const createTokenTx = (await tokenFactoryContract.createToken("BridgeToken", "bTKN"));
    const receipt = await createTokenTx.wait();

    const address: string = ethers.utils.hexStripZeros(receipt.events.filter((e: { event: string; }) => e.event == "TokenCreated")[0].topics[1]);

    expect(await tokenFactoryContract.lookupTokenContract(address))
      .to.be.properAddress;
  });
  
  it('Should return zero address when token is not created from factory',async () => {
    const tokenFactory: ContractFactory = await ethers.getContractFactory("ERC20Token");
    const regularERC20 = await tokenFactory.deploy("Token", "TKN");

    expect(await tokenFactoryContract.lookupTokenContract(regularERC20.address))
      .to.equal(ethers.constants.AddressZero);
  })
});