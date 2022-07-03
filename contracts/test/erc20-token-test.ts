import { Contract, Wallet } from "ethers";
import { expect } from "chai";
import ERC20TokenABI from "../artifacts/contracts/ERC20Token.sol/ERC20Token.json";
import { deployContract, MockProvider } from "ethereum-waffle";

describe("ERC20Token", function () {
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
