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
  let accounts: Signer[];
  let bridge: Contract;
  let erc20Token: Contract;
  let validator: Wallet;
  let validator2: Wallet;
  let user: Wallet;
  let deployer: Wallet;

  before(async function () {
    provider = new MockProvider();
    [deployer, validator, validator2, user] = provider.getWallets();

    accounts = await ethers.getSigners();
    
    bridge = await deployContract(deployer, BridgeABI, [[validator.address, validator2.address]]);
    await bridge.deployed();
    
    erc20Token = await deployContract(deployer, ERC20TokenABI, ["Token", "TKN"]); 
    await erc20Token.deployed();    
  });

  describe('Lock', function () {
    it('Should not allow transfer 0 amount',async () => {     
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 0;
      const signature = await getUserPermit(user, erc20Token, bridge.address, amount, targetChainId);
      
      await expect(bridge.lock(targetChainId, tokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
          .to.be.revertedWith('Bridged amount is required.');
    });

    it('Should transfer token with permit', async () => {      
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signature = await getUserPermit(user, erc20Token, bridge.address, amount, targetChainId);
      
      await erc20Token.mint(userAddress, amount);
      await expect(bridge
        .connect(user)
        .lock(targetChainId, tokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
        .to.emit(bridge, 'Lock')
        .withArgs(userAddress, targetChainId, tokenAddress, amount)
      expect(await erc20Token.balanceOf(userAddress)).to.equal(0);
    });
  });

  describe('Mint', function () {
    
    it("Should allow mint with one registered validator", async function () {  
      const token: Contract = await deployContract(deployer, ERC20TokenABI, ["Token", "TKN"]);    
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const tokenAddress: string = token.address;
      const signatures: string[] = [];
      
      const sig = await getValidatorAllowanceSignature(validator, receiverAddress, amount, tokenAddress, bridge.address);
      signatures.push(sig);
      
      await expect(bridge.connect(user).mint(receiverAddress, amount, tokenAddress, signatures, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
        .to.emit(bridge, 'Mint')
        .withArgs(receiverAddress, tokenAddress, amount);
    });
  
    it("Should allow mint with more than one validators registered", async function () {      
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const tokenAddress: string = await erc20Token.resolvedAddress;
      const signatures: string[] = [];
      signatures.push(await getValidatorAllowanceSignature(validator, receiverAddress, amount, tokenAddress, bridge.address));
      signatures.push(await getValidatorAllowanceSignature(validator2, receiverAddress, amount, tokenAddress, bridge.address));
      
      await expect(bridge.connect(user).mint(receiverAddress, amount, tokenAddress, signatures, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
        .to.emit(bridge, 'Mint')
        .withArgs(receiverAddress, tokenAddress, amount);
    });
  
    it("Should not allow mint when validator is not registered", async function () {
      const unregisteredValidator: Wallet = provider.createEmptyWallet();
  
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const token: string = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const signatures: string[] = [];
      const sig = await getValidatorAllowanceSignature(unregisteredValidator, receiverAddress, amount, token, bridge.address);
      signatures.push(sig);
      
      await expect(bridge.connect(user).mint(receiverAddress, amount, token, signatures, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
        .to.be.revertedWith('Unrecognized validator signature');
    });

    it('Should not allow mint of token created outside of the factory',async () => {
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const token: string = erc20Token.address;
      const signatures: string[] = [];
      const sig = await getValidatorAllowanceSignature(validator, receiverAddress, amount, token, bridge.address);
      signatures.push(sig);
      
      await expect(bridge.connect(user).mint(receiverAddress, amount, token, signatures, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
        .to.be.revertedWith('Wrapped Token is not existing');
    })
  });

  describe('Burn', function (){
    it('Should burn token', async () => {      
      const targetChainId: number = 1;
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedToken: Contract = await ethers.getContractAtFromArtifact(ERC20TokenABI, "0xa16e02e87b7454126e5e10d957a927a7f5b5d2be");
      const signature = await getUserPermit(user, wrappedToken, receiverAddress, amount, targetChainId);
      console.log(signature);
      await expect(bridge.connect(user).burn(targetChainId, wrappedToken.address, amount, signature.deadline, signature.v, signature.r, signature.s))
        .to.emit(bridge, 'Burn');
    }) 

    it('Should not allow burn with 0 amount', async () => {
      
    });

    it('Should not allow burn of token not registered in the factory',async () => {
      
    });
  });

  describe('Release', function (){

  });

  describe('Create Token', function(){

    it('Should create token with signatures', async () => { 
      const userAddress: string = await user.getAddress();
      const wrappedTokenName: string = "BridgeToken"
      const wrappedTokenSymbol: string = "bTKN";
      const signatures: string[] = [];
      const tokenFactoryAddress: string = await bridge.tokenFactory();
      const factory:Contract = await ethers.getContractAtFromArtifact(TokenFactoryABI, tokenFactoryAddress, deployer);
      
      signatures.push(await getValidatorTokenCreationSignature(validator, bridge.address, userAddress, wrappedTokenName, wrappedTokenSymbol));
      // TODO signature passes but revert for some reason
      const tx = await factory.connect(bridge.signer).createToken(wrappedTokenName, wrappedTokenSymbol, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 100000 });
      console.log(tx);
      await expect(bridge.connect(user).createToken(wrappedTokenName, wrappedTokenSymbol, signatures, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 100000 }))
        .to.emit(factory, 'Pass')
        .withArgs(wrappedTokenName, wrappedTokenSymbol);
    });
  });
});
