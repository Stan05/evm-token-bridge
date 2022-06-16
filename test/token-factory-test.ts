import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, Wallet } from "ethers";
import { expect } from "chai";
import { deployContract, MockProvider } from "ethereum-waffle";
import WrappedTokenContracFactoryABI from "../artifacts/contracts/WrappedTokenFactory.sol/WrappedTokenFactory.json";

describe("TokenFactory", function () {
  let provider: MockProvider;
  let deployer: Wallet;
  let user: Wallet;
  let wrappedTokenFactoryContract: Contract;

  beforeEach(async function () {
    provider = new MockProvider();
    [deployer, user] = provider.getWallets();  
    wrappedTokenFactoryContract = await deployContract(deployer, WrappedTokenContracFactoryABI, []); 
  });

  
  it('Should create new token and return it\'s address', async function () {
    const createTokenTx = (await wrappedTokenFactoryContract.createToken("BridgeToken", "bTKN"));
    const receipt = await createTokenTx.wait();

    const address: string = ethers.utils.hexStripZeros(receipt.events.filter((e: { event: string; }) => e.event == "TokenCreated")[0].topics[1]);

    expect(await wrappedTokenFactoryContract.lookupTokenContract(address))
      .to.be.properAddress;
  });
  
  it('Should return zero address when token is not created from factory',async () => {
    const tokenFactory: ContractFactory = await ethers.getContractFactory("ERC20Token");
    const regularERC20 = await tokenFactory.deploy("Token", "TKN", deployer.address);

    expect(await wrappedTokenFactoryContract.lookupTokenContract(regularERC20.address))
      .to.equal(ethers.constants.AddressZero);
  })
});