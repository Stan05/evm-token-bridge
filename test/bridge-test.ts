import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory, Signer, Wallet } from "ethers";
import { expect} from "chai";
import { MockProvider } from "@ethereum-waffle/provider";

describe("Bridge", function () {
  let accounts: Signer[];
  let bridge: Contract;
  let token: Contract;

  beforeEach(async function () {
    const bridgeFactory: ContractFactory = await ethers.getContractFactory("Bridge");
    bridge = await bridgeFactory.deploy();
    await bridge.deployed();

    const tokenFactory: ContractFactory = await ethers.getContractFactory("BridgeERC20");
    token = await tokenFactory.deploy("Token", "TKN", bridge.address);
    await token.deployed();

    accounts = await ethers.getSigners();
  });

  describe('Lock', function () {
    it('Should transfer token with permit', async () => {
      let user: Wallet = ethers.Wallet.createRandom();
      
      const targetChainId: number = 2;
      const tokenAddress: string = token.address;
      const amount: number = 10;
      await token.mint(await user.getAddress(), amount);
      const signature = await getUserPermit(user, token, bridge.address, amount);
      
      await bridge
          .connect(user)
          .lock(targetChainId, tokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s);
      expect(await token.balanceOf(bridge.address)).to.equal(amount);
      expect(await token.balanceOf(await user.getAddress())).to.equal(0);
    });
  });

  describe('Mint', function () {
    
    it("Should allow mint with one registered validator", async function () {      
      const user: Signer = accounts[1];
      const validator = ethers.Wallet.createRandom();
      await bridge.registerValidator(await validator.getAddress());

      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const tokenAddress: string = token.address;
      const signatures: string[] = [];
      const sig = await getValidatorMintSignature(validator, receiverAddress, amount, tokenAddress, bridge.address);
      signatures.push(sig);
          
      expect(await bridge.hasAccess(await validator.getAddress())).to.be.true;
      expect(
        await bridge.connect(user).mint(receiverAddress, amount, tokenAddress, signatures)
      ).not.throw;
      expect(
        (await token.balanceOf(receiverAddress)).toNumber()
      ).to.equal(amount);
    });
  
    it("Should allow mint with more than one validators registered", async function () {      
      const user: Signer = accounts[1];
      const validator = ethers.Wallet.createRandom();
      const validator2 = ethers.Wallet.createRandom();
      await bridge.registerValidator(await validator.getAddress());
      await bridge.registerValidator(await validator2.getAddress());

      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const tokenAddress: string = token.address;
      const signatures: string[] = [];
      signatures.push(await getValidatorMintSignature(validator, receiverAddress, amount, tokenAddress, bridge.address));
      signatures.push(await getValidatorMintSignature(validator2, receiverAddress, amount, tokenAddress, bridge.address));
      
      expect(await bridge.hasAccess(await validator.getAddress())).to.be.true;
      expect(await bridge.hasAccess(await validator2.getAddress())).to.be.true;
      expect(
        await bridge.connect(user).mint(receiverAddress, amount, tokenAddress, signatures)
      ).not.throw;
      expect(
        (await token.balanceOf(receiverAddress)).toNumber()
      ).to.equal(amount);
    });
  
    it("Should not allow mint when validator is not registered", async function () {    
      const user: Signer = accounts[1];
      const validator = ethers.Wallet.createRandom();
  
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const token: string = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const signatures: string[] = [];
      const sig = await getValidatorMintSignature(validator, receiverAddress, amount, token, bridge.address);
      signatures.push(sig);
      
      await expect(bridge.connect(user).mint(receiverAddress, amount, token, signatures)).to.be.revertedWith('Unrecognized validator signature');
    });
  });
});

const getUserPermit = async (user: Wallet, token: Contract, spender: string, amount: number) => {
  const nonce = await token.nonces(user.address);
  const deadline: number = + new Date() + 60 * 60; 
  const signature = await user._signTypedData(
    {
      name: await token.name(),
      version: '1',
      verifyingContract: token.address
    },
    {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ],
    },
    {
      owner: user.address, 
      spender: spender, 
      value: amount,
      nonce: nonce.toHexString(),
      deadline
    });
    const splitSignature = ethers.utils.splitSignature(signature);
    
    const preparedSignature = {
        v: splitSignature.v,
        r: splitSignature.r,
        s: splitSignature.s,
        deadline
    };
    return preparedSignature;
}

const getValidatorMintSignature = async (validator: Wallet, receiverAddress: string, amount: number, targetToken: string, bridgeAddress: string) => {
  return await validator._signTypedData(
    {
      name: "Bridge",
      version: '1',
      chainId: 31337,
      verifyingContract: bridgeAddress
    },
    {
        mint: [
          { name: 'receiver', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' }
        ],
    },
    {
      receiver: receiverAddress, 
      amount: amount, 
      token: targetToken,
    });
}