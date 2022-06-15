import { ethers } from "hardhat";
import { BigNumber, Contract, Wallet } from "ethers";
import { expect } from "chai";
import BridgeABI from "../artifacts/contracts/Bridge.sol/Bridge.json";
import ERC20TokenABI from "../artifacts/contracts/ERC20Token.sol/ERC20Token.json";
import TokenFactoryABI from "../artifacts/contracts/TokenFactory.sol/TokenFactory.json";
import GovernanceABI from "../artifacts/contracts/Governance.sol/Governance.json";
import { getUserPermit, getValidatorAllowanceSignature, getValidatorTokenCreationSignature } from "./helper/helper-functions";
import { deployContract, MockProvider } from "ethereum-waffle";
import { getAddress } from "ethers/lib/utils";

describe("Bridge", function () {
  let provider: MockProvider;
  let governance: Contract;
  let bridge: Contract;
  let erc20Token: Contract;
  let wrappedErc20Token: Contract;

  let validator: Wallet;
  let validator2: Wallet;
  let unregisteredValidator: Wallet;
  let user: Wallet;
  let deployer: Wallet;

  before(async function () {
    provider = new MockProvider();
    [deployer, validator, validator2, user, unregisteredValidator] = provider.getWallets();

    governance = await deployContract(deployer, GovernanceABI, [[validator.address, validator2.address]]);
    await governance.deployed();

    const tokenFactory: Contract = await deployContract(deployer, TokenFactoryABI, []);
    await tokenFactory.deployed();

    bridge = await deployContract(deployer, BridgeABI, [governance.address, tokenFactory.address]);
    await bridge.deployed();
    
    await governance.transferOwnership(bridge.address);
    await tokenFactory.transferOwnership(bridge.address);
    
    erc20Token = await deployContract(deployer, ERC20TokenABI, ["Token", "TKN", deployer.address]); 
    await erc20Token.deployed(); 

    const wrappedTokenName: string = "Bridge" + await erc20Token.name();
    const wrappedTokenSymbol: string = "b" + await erc20Token.symbol();
    const signatures: string[] = [];
    signatures.push(await getValidatorTokenCreationSignature(validator, governance.address, user.address, wrappedTokenName, wrappedTokenSymbol));
    
    const estimate = await bridge.connect(user).estimateGas.createToken(wrappedTokenName, wrappedTokenSymbol, signatures);
    const tx = await bridge.connect(user).createToken(wrappedTokenName, wrappedTokenSymbol, signatures);
    const receipt = await tx.wait();
   
    const wrappedTokenAddress: string = getAddress(ethers.utils.hexStripZeros(receipt.events[0].address));
    wrappedErc20Token = await ethers.getContractAtFromArtifact(ERC20TokenABI, wrappedTokenAddress, deployer);
  });

  describe('Lock', function () {
    it('Should not allow lock 0 amount',async () => {     
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 0;
      const signature = await getUserPermit(user, erc20Token, bridge.address, amount, targetChainId);
      
      await expect(bridge.lock(targetChainId, tokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
          .to.be.revertedWith('Bridged amount is required.');
    });

    it('Should lock token with permit', async () => {      
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
        .withArgs(userAddress, targetChainId, tokenAddress, amount);
      expect(await erc20Token.balanceOf(userAddress)).to.equal(0);
    });

    it('Should not allow lock token with invalid permit', async () => {      
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signature = await getUserPermit(user, erc20Token, bridge.address, amount, targetChainId);
      
      await erc20Token.mint(userAddress, amount);
      await expect(bridge
        .connect(user)
        .lock(targetChainId, tokenAddress, amount + 1, signature.deadline, signature.v, signature.r, signature.s, { gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 1000000 }))
        .to.be.revertedWith('ERC20Permit: invalid signature');
    });
  });

  describe('Mint', function () {
    
    it("Should allow mint with registered validator", async function () {  
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signatures: string[] = [];
      signatures.push(await getValidatorAllowanceSignature(validator, receiverAddress, amount, wrappedTokenAddress, governance.address));
      
      const estimate = bridge.connect(user).estimateGas.mint(receiverAddress, amount, wrappedTokenAddress, signatures);
      await expect(bridge.connect(user).mint(receiverAddress, amount, wrappedTokenAddress, signatures, { gasPrice: estimate }))
        .to.emit(bridge, 'Mint')
        .withArgs(receiverAddress, wrappedTokenAddress, amount);
    });
    
    it("Should not allow mint with unrecognized validator", async function () { 
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signatures: string[] = [];
      signatures.push(await getValidatorAllowanceSignature(unregisteredValidator, receiverAddress, amount, wrappedTokenAddress, governance.address));
      
      const estimate = bridge.connect(user).estimateGas.mint(receiverAddress, amount, wrappedTokenAddress, signatures);
      await expect(bridge.connect(user).mint(receiverAddress, amount, wrappedTokenAddress, signatures, { gasPrice: estimate }))
        .to.be.revertedWith('Unrecognized validator signature');
    });

    it('Should not allow mint of token created outside of the factory',async () => {
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = erc20Token.address;
      const signatures: string[] = [];
      const sig = await getValidatorAllowanceSignature(validator, receiverAddress, amount, wrappedTokenAddress, governance.address);
      signatures.push(sig);
  
      await expect(bridge.connect(user).mint(receiverAddress, amount, wrappedTokenAddress, signatures))
        .to.be.revertedWith('Wrapped Token is not existing');
    })
  });

  describe('Burn', function (){
    it('Should burn token', async () => { 
      const sourceChainId: number = 1;     
      const targetChainId: number = 1337;
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signature = await getUserPermit(user, wrappedErc20Token, bridge.address, amount, sourceChainId);
      
      const estimate = bridge.connect(user).estimateGas.burn(targetChainId, wrappedTokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s); 
      await expect(bridge.connect(user).burn(targetChainId, wrappedTokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s, {gasPrice: estimate}))
        .to.emit(bridge, 'Burn');
    }) 

    it('Should not allow burn with 0 amount', async () => {
      const targetChainId: number = 1;
      const receiverAddress: string = await user.getAddress();
      const amount: number = 0;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signature = await getUserPermit(user, wrappedErc20Token, receiverAddress, amount, targetChainId);
      
      await expect(bridge.connect(user).burn(targetChainId, wrappedTokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s))
        .to.be.revertedWith('Burnt amount is required.');
    });

    it('Should not allow burn of token not registered in the factory',async () => {
      const targetChainId: number = 1;
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = erc20Token.address;
      const signature = await getUserPermit(user, erc20Token, receiverAddress, amount, targetChainId);
      
      await expect(bridge.connect(user).burn(targetChainId, wrappedTokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s))
        .to.be.revertedWith('Wrapped Token is not existing');
    });

    
    it('Should not allow burn token with invalid permit', async () => {      
      const targetChainId: number = 1;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const amount: number = 10;
      const signature = await getUserPermit(user, wrappedErc20Token, bridge.address, amount + 1, targetChainId);
      
      await expect(bridge.connect(user).burn(targetChainId, wrappedTokenAddress, amount, signature.deadline, signature.v, signature.r, signature.s))
        .to.be.revertedWith('ERC20Permit: invalid signature');
    });
  });

  describe('Release', function (){
    it('Should release of token with permit', async () => {
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signatures: string[] = [];
      signatures.push(await getValidatorAllowanceSignature(validator, userAddress, amount, tokenAddress, governance.address));
      
      const initialBalance: BigNumber = await erc20Token.balanceOf(userAddress);
      await erc20Token.mint(bridge.address, amount);
      await expect(bridge.connect(user).release(userAddress, amount, tokenAddress, signatures))
        .to.emit(bridge, 'Release')
        .withArgs(userAddress, tokenAddress, amount);
      expect(await erc20Token.balanceOf(userAddress)).to.equal(initialBalance.add(amount));
    });

    it('Should not allow release with unrecognized validator', async () => {    
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signatures: string[] = [];
      signatures.push(await getValidatorAllowanceSignature(unregisteredValidator, userAddress, amount, tokenAddress, governance.address));
      
      await expect(bridge.connect(user).release(userAddress, amount, tokenAddress, signatures))
        .to.be.revertedWith('Unrecognized validator signature');
    });
  });

  describe('Create Token', function(){

    it('Should create token with signatures', async () => { 
      const userAddress: string = await user.getAddress();
      const wrappedTokenName: string = "BridgeToken"
      const wrappedTokenSymbol: string = "bTKN";
      const signatures: string[] = [];
      signatures.push(await getValidatorTokenCreationSignature(validator, governance.address, userAddress, wrappedTokenName, wrappedTokenSymbol));

      const tokenFactoryAddress: string = await bridge.tokenFactory();
      const factory: Contract = await ethers.getContractAtFromArtifact(TokenFactoryABI, tokenFactoryAddress, deployer);

      const estimate = await bridge.connect(user).estimateGas.createToken(wrappedTokenName, wrappedTokenSymbol, signatures);
      await expect(bridge.connect(user).createToken(wrappedTokenName, wrappedTokenSymbol, signatures, { gasPrice: estimate}))
        .to.emit(factory, 'TokenCreated')
        .and.not.reverted;
    });

    it('Should not allow create token with unrecognized validator', async () => { 
      const userAddress: string = await user.getAddress();
      const wrappedTokenName: string = "BridgeToken"
      const wrappedTokenSymbol: string = "bTKN";
      const signatures: string[] = [];
      signatures.push(await getValidatorTokenCreationSignature(unregisteredValidator, governance.address, userAddress, wrappedTokenName, wrappedTokenSymbol));

      await expect(bridge.connect(user).createToken(wrappedTokenName, wrappedTokenSymbol, signatures))
        .to.be.revertedWith('Unrecognized validator signature');
    });
  });
});
