import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, Wallet } from "ethers";
import { expect } from "chai";
import ERC20TokenABI from "../artifacts/contracts/ERC20Token.sol/ERC20Token.json";

describe("Bridge", function () {
  let accounts: Signer[];
  let bridge: Contract;
  let bridgeToken: Contract;
  let validator: Wallet;
  let validator2: Wallet;

  before(async function () {
    accounts = await ethers.getSigners();
    validator = ethers.Wallet.createRandom();
    validator2 = ethers.Wallet.createRandom();
    
    const bridgeFactory: ContractFactory = await ethers.getContractFactory("Bridge");
    bridge = await bridgeFactory.deploy([validator.address, validator2.address]);
    await bridge.deployed();

    const createTokenTx = (await bridge.createToken("BridgeToken", "bTKN"));
    const receipt = await createTokenTx.wait();
    const tokenAddress: string = ethers.utils.hexStripZeros(receipt.events.filter((e: { event: string; }) => e.event == "TokenCreated")[0].topics[1]);
    
    bridgeToken = await ethers.getContractAtFromArtifact(ERC20TokenABI, tokenAddress);
  });

  describe('Lock', function () {
    it('Should not allow transfer 0 amount',async () => {
      let user: Wallet = ethers.Wallet.createRandom();
      const tokenFactory: ContractFactory = await ethers.getContractFactory("ERC20Token");
      const regularToken = await tokenFactory.deploy("Token", "TKN");
      await regularToken.deployed();

      const targetChainId: number = 1337;
      const tokenAddress: string = regularToken.address;
      const amount: number = 0;
      await regularToken.mint(await user.getAddress(), amount);
      const signature = await getUserPermit(user, regularToken, bridge.address, amount);
      
      await expect(bridge.lock(targetChainId, tokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s))
          .to.be.revertedWith('Bridged amount is required.');
    });

    it('Should transfer token with permit', async () => {
      let user: Wallet = ethers.Wallet.createRandom();
      user = user.connect(ethers.getDefaultProvider());
      const tokenFactory: ContractFactory = await ethers.getContractFactory("ERC20Token");
      const regularToken = await tokenFactory.deploy("Token", "TKN");
      await regularToken.deployed();

      const targetChainId: number = 1337;
      const tokenAddress: string = regularToken.address;
      const amount: number = 10;
      await regularToken.mint(await user.getAddress(), amount);
      const signature = await getUserPermit(user, regularToken, bridge.address, amount);
      
      await bridge
          .connect(user)
          .lock(targetChainId, tokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s);
    });
  });

  describe('Mint', function () {
    
    it("Should allow mint with one registered validator", async function () {      
      const user: Signer = accounts[1];

      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const tokenAddress: string = bridgeToken.address;
      const signatures: string[] = [];
      const sig = await getValidatorMintSignature(validator, receiverAddress, amount, tokenAddress, bridge.address);
      signatures.push(sig);
          
      expect(await bridge.hasAccess(await validator.getAddress()))
        .to.be.true;
      await expect(() => bridge.connect(user).mint(receiverAddress, amount, tokenAddress, signatures))
        .to.changeTokenBalance(bridgeToken, user, amount);
    });
  
    it("Should allow mint with more than one validators registered", async function () {      
      const user: Signer = accounts[1];

      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const tokenAddress: string = bridgeToken.address;
      const signatures: string[] = [];
      signatures.push(await getValidatorMintSignature(validator, receiverAddress, amount, tokenAddress, bridge.address));
      signatures.push(await getValidatorMintSignature(validator2, receiverAddress, amount, tokenAddress, bridge.address));
      
      expect(await bridge.hasAccess(await validator.getAddress())).to.be.true;
      expect(await bridge.hasAccess(await validator2.getAddress())).to.be.true;
      await expect(() => bridge.connect(user).mint(receiverAddress, amount, tokenAddress, signatures))
        .to.changeTokenBalance(bridgeToken, user, amount);
    });
  
    it("Should not allow mint when validator is not registered", async function () {    
      const user: Signer = accounts[1];
      const unregisteredValidator = ethers.Wallet.createRandom();
  
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const token: string = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const signatures: string[] = [];
      const sig = await getValidatorMintSignature(unregisteredValidator, receiverAddress, amount, token, bridge.address);
      signatures.push(sig);
      
      await expect(bridge.connect(user).mint(receiverAddress, amount, token, signatures)).to.be.revertedWith('Unrecognized validator signature');
    });

    it('Should not allow mint of token created outside of the factory',async () => {
      const tokenFactory: ContractFactory = await ethers.getContractFactory("ERC20Token");
      const regularToken = await tokenFactory.deploy("Token", "TKN");
      await regularToken.deployed();   

      const user: Signer = accounts[1];
  
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const token: string = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const signatures: string[] = [];
      const sig = await getValidatorMintSignature(validator, receiverAddress, amount, token, bridge.address);
      signatures.push(sig);
      
      await expect(bridge.connect(user).mint(receiverAddress, amount, token, signatures)).to.be.revertedWith('Token is not existing');
    })
  });
});

const getUserPermit = async (user: Wallet, token: Contract, spender: string, amount: number) => {
  const nonce = await token.nonces(user.address);
  const deadline: number = + new Date() + 60 * 60; 
  
  const signature = await user._signTypedData(
    {
      name: await token.name(),
      version: '1',
      chainId: 31337,
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
      nonce: nonce,
      deadline: deadline
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