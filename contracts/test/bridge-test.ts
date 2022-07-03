import { ethers } from "hardhat";
import { BigNumber, Contract, Wallet } from "ethers";
import { expect } from "chai";
import BridgeABI from "../artifacts/contracts/Bridge.sol/Bridge.json";
import ERC20TokenABI from "../artifacts/contracts/ERC20Token.sol/ERC20Token.json";
import WrappedTokenFactoryABI from "../artifacts/contracts/WrappedTokenFactory.sol/WrappedTokenFactory.json";
import GovernanceABI from "../artifacts/contracts/Governance.sol/Governance.json";
import FeeCalculatorABI from "../artifacts/contracts/FeeCalculator.sol/FeeCalculator.json";
import ERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

import {
  getUserPermit,
  getValidatorAllowanceSignature,
} from "./helper/helper-functions";
import { deployContract, MockProvider } from "ethereum-waffle";
import { getAddress } from "ethers/lib/utils";

describe("Bridge", function () {
  let provider: MockProvider;
  let governance: Contract;
  let bridge: Contract;
  let erc20Token: Contract;
  let wrappedErc20Token: Contract;
  let feeCalculator: Contract;

  let validator: Wallet;
  let validator2: Wallet;
  let unregisteredValidator: Wallet;
  let user: Wallet;
  let deployer: Wallet;
  const serviceFee: BigNumber = ethers.utils.parseEther("0.005");

  before(async function () {
    provider = new MockProvider();
    [deployer, validator, validator2, user, unregisteredValidator] =
      provider.getWallets();

    feeCalculator = await deployContract(deployer, FeeCalculatorABI, [
      serviceFee,
    ]);
    await feeCalculator.deployed();

    governance = await deployContract(deployer, GovernanceABI, [
      [validator.address, validator2.address],
    ]);
    await governance.deployed();

    const wrappedTokenFactory: Contract = await deployContract(
      deployer,
      WrappedTokenFactoryABI,
      []
    );
    await wrappedTokenFactory.deployed();

    bridge = await deployContract(deployer, BridgeABI, [
      governance.address,
      wrappedTokenFactory.address,
      feeCalculator.address,
    ]);
    await bridge.deployed();

    await governance.transferOwnership(bridge.address);
    await wrappedTokenFactory.transferOwnership(bridge.address);
    await feeCalculator.transferOwnership(bridge.address);

    erc20Token = await deployContract(deployer, ERC20TokenABI, [
      "Token",
      "TKN",
      deployer.address,
    ]);
    await erc20Token.deployed();

    const wrappedTokenName: string = "Bridge" + (await erc20Token.name());
    const wrappedTokenSymbol: string = "b" + (await erc20Token.symbol());

    const tx = await bridge
      .connect(validator)
      .createToken(wrappedTokenName, wrappedTokenSymbol);
    const receipt = await tx.wait();

    const wrappedTokenAddress: string = getAddress(
      ethers.utils.hexStripZeros(receipt.events[0].address)
    );
    wrappedErc20Token = await ethers.getContractAtFromArtifact(
      ERC20TokenABI,
      wrappedTokenAddress,
      deployer
    );
  });

  describe("LockWithPermit", function () {
    it("Should not allow lock 0 amount", async () => {
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 0;
      const signature = await getUserPermit(
        user,
        erc20Token,
        bridge.address,
        amount,
        targetChainId
      );

      await expect(
        bridge.lockWithPermit(
          targetChainId,
          tokenAddress,
          amount,
          signature.deadline,
          signature.v,
          signature.r,
          signature.s
        )
      ).to.be.revertedWith("Bridged amount is required.");
    });

    it("Should not allow lock with not enough fee", async function () {
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 1;
      const signature = await getUserPermit(
        user,
        erc20Token,
        bridge.address,
        amount,
        targetChainId
      );

      await expect(
        bridge.lockWithPermit(
          targetChainId,
          tokenAddress,
          amount,
          signature.deadline,
          signature.v,
          signature.r,
          signature.s
        )
      ).to.be.revertedWith("Not enough service fee");
    });

    it("Should lock token with permit", async () => {
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signature = await getUserPermit(
        user,
        erc20Token,
        bridge.address,
        amount,
        targetChainId
      );

      await erc20Token.mint(userAddress, amount);
      await expect(
        bridge
          .connect(user)
          .lockWithPermit(
            targetChainId,
            tokenAddress,
            amount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s,
            {
              value: serviceFee,
            }
          )
      )
        .to.emit(bridge, "Lock")
        .withArgs(userAddress, targetChainId, tokenAddress, amount);
      expect(await erc20Token.balanceOf(userAddress)).to.equal(0);
    });

    it("Should not allow lock token with invalid permit", async () => {
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signature = await getUserPermit(
        user,
        erc20Token,
        bridge.address,
        amount,
        targetChainId
      );

      await erc20Token.mint(userAddress, amount);
      await expect(
        bridge
          .connect(user)
          .lockWithPermit(
            targetChainId,
            tokenAddress,
            amount + 1,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s,
            {
              value: serviceFee,
            }
          )
      ).to.be.revertedWith("ERC20Permit: invalid signature");
    });
  });

  describe("Lock", function () {
    it("Should not allow lock 0 amount", async () => {
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 0;
      const signature = await getUserPermit(
        user,
        erc20Token,
        bridge.address,
        amount,
        targetChainId
      );

      await expect(
        bridge.lockWithPermit(
          targetChainId,
          tokenAddress,
          amount,
          signature.deadline,
          signature.v,
          signature.r,
          signature.s
        )
      ).to.be.revertedWith("Bridged amount is required.");
    });

    it("Should not allow lock with not enough fee", async function () {
      const targetChainId: number = 1;
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const signature = await getUserPermit(
        user,
        erc20Token,
        bridge.address,
        amount,
        targetChainId
      );

      await expect(
        bridge.lockWithPermit(
          targetChainId,
          tokenAddress,
          amount,
          signature.deadline,
          signature.v,
          signature.r,
          signature.s
        )
      ).to.be.revertedWith("Not enough service fee");
    });
  });

  describe("Mint", function () {
    it("Should allow mint with registered validator", async function () {
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signatures: string[] = [];
      signatures.push(
        await getValidatorAllowanceSignature(
          validator,
          receiverAddress,
          amount,
          wrappedTokenAddress,
          governance
        )
      );

      await expect(
        bridge
          .connect(user)
          .mint(receiverAddress, amount, wrappedTokenAddress, signatures)
      )
        .to.emit(bridge, "Mint")
        .withArgs(receiverAddress, wrappedTokenAddress, amount);
    });

    it("Should not allow mint with unrecognized validator", async function () {
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signatures: string[] = [];
      signatures.push(
        await getValidatorAllowanceSignature(
          unregisteredValidator,
          receiverAddress,
          amount,
          wrappedTokenAddress,
          governance
        )
      );

      await expect(
        bridge
          .connect(user)
          .mint(receiverAddress, amount, wrappedTokenAddress, signatures)
      ).to.be.revertedWith("Unrecognized validator signature");
    });

    it("Should not allow multiple mints with one signature", async () => {
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signatures: string[] = [];
      signatures.push(
        await getValidatorAllowanceSignature(
          validator,
          receiverAddress,
          amount,
          wrappedTokenAddress,
          governance
        )
      );

      await expect(
        bridge
          .connect(user)
          .mint(receiverAddress, amount, wrappedTokenAddress, signatures)
      )
        .to.emit(bridge, "Mint")
        .withArgs(receiverAddress, wrappedTokenAddress, amount);
      await expect(
        bridge
          .connect(user)
          .mint(receiverAddress, amount, wrappedTokenAddress, signatures)
      ).to.be.revertedWith("Unrecognized validator signature");
    });

    it("Should not allow mint of token created outside of the factory", async () => {
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = erc20Token.address;
      const signatures: string[] = [];
      const sig = await getValidatorAllowanceSignature(
        validator,
        receiverAddress,
        amount,
        wrappedTokenAddress,
        governance
      );
      signatures.push(sig);

      await expect(
        bridge
          .connect(user)
          .mint(receiverAddress, amount, wrappedTokenAddress, signatures)
      ).to.be.revertedWith("Wrapped Token is not existing");
    });
  });

  describe("Burn", function () {
    it("Should burn token", async () => {
      const sourceChainId: number = 1;
      const targetChainId: number = 1337;
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signature = await getUserPermit(
        user,
        wrappedErc20Token,
        bridge.address,
        amount,
        sourceChainId
      );

      await expect(
        bridge
          .connect(user)
          .burn(
            targetChainId,
            wrappedTokenAddress,
            amount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s,
            {
              value: serviceFee,
            }
          )
      ).to.emit(bridge, "Burn");
    });

    it("Should not allow burn with 0 amount", async () => {
      const targetChainId: number = 1;
      const receiverAddress: string = await user.getAddress();
      const amount: number = 0;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signature = await getUserPermit(
        user,
        wrappedErc20Token,
        receiverAddress,
        amount,
        targetChainId
      );

      await expect(
        bridge
          .connect(user)
          .burn(
            targetChainId,
            wrappedTokenAddress,
            amount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s
          )
      ).to.be.revertedWith("Burnt amount is required.");
    });

    it("Should not allow burn with not enough fee", async function () {
      const targetChainId: number = 1;
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const signature = await getUserPermit(
        user,
        wrappedErc20Token,
        receiverAddress,
        amount,
        targetChainId
      );

      await expect(
        bridge
          .connect(user)
          .burn(
            targetChainId,
            wrappedTokenAddress,
            amount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s
          )
      ).to.be.revertedWith("Not enough service fee");
    });

    it("Should not allow burn of token not registered in the factory", async () => {
      const targetChainId: number = 1;
      const receiverAddress: string = await user.getAddress();
      const amount: number = 10;
      const wrappedTokenAddress: string = erc20Token.address;
      const signature = await getUserPermit(
        user,
        erc20Token,
        receiverAddress,
        amount,
        targetChainId
      );

      await expect(
        bridge
          .connect(user)
          .burn(
            targetChainId,
            wrappedTokenAddress,
            amount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s,
            {
              value: serviceFee,
            }
          )
      ).to.be.revertedWith("Wrapped Token is not existing");
    });

    it("Should not allow burn token with invalid permit", async () => {
      const targetChainId: number = 1;
      const wrappedTokenAddress: string = wrappedErc20Token.address;
      const amount: number = 10;
      const signature = await getUserPermit(
        user,
        wrappedErc20Token,
        bridge.address,
        amount + 1,
        targetChainId
      );

      await expect(
        bridge
          .connect(user)
          .burn(
            targetChainId,
            wrappedTokenAddress,
            amount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s,
            {
              value: serviceFee,
            }
          )
      ).to.be.revertedWith("ERC20Permit: invalid signature");
    });
  });

  describe("Release", function () {
    it("Should release of token with permit", async () => {
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signatures: string[] = [];
      signatures.push(
        await getValidatorAllowanceSignature(
          validator,
          userAddress,
          amount,
          tokenAddress,
          governance
        )
      );

      const initialBalance: BigNumber = await erc20Token.balanceOf(userAddress);
      await erc20Token.mint(bridge.address, amount);
      await expect(
        bridge
          .connect(user)
          .release(userAddress, amount, tokenAddress, signatures)
      )
        .to.emit(bridge, "Release")
        .withArgs(userAddress, tokenAddress, amount);
      expect(await erc20Token.balanceOf(userAddress)).to.equal(
        initialBalance.add(amount)
      );
    });

    it("Should not allow multiple mints with one signature", async () => {
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signatures: string[] = [];
      signatures.push(
        await getValidatorAllowanceSignature(
          validator,
          userAddress,
          amount,
          tokenAddress,
          governance
        )
      );

      await expect(
        bridge
          .connect(user)
          .release(userAddress, amount, tokenAddress, signatures)
      )
        .to.emit(bridge, "Release")
        .withArgs(userAddress, tokenAddress, amount);
      await expect(
        bridge
          .connect(user)
          .release(userAddress, amount, tokenAddress, signatures)
      ).to.be.revertedWith("Unrecognized validator signature");
    });

    it("Should not allow release with unrecognized validator", async () => {
      const tokenAddress: string = erc20Token.address;
      const amount: number = 10;
      const userAddress: string = await user.getAddress();
      const signatures: string[] = [];
      signatures.push(
        await getValidatorAllowanceSignature(
          unregisteredValidator,
          userAddress,
          amount,
          tokenAddress,
          governance
        )
      );

      await expect(
        bridge
          .connect(user)
          .release(userAddress, amount, tokenAddress, signatures)
      ).to.be.revertedWith("Unrecognized validator signature");
    });
  });

  describe("Create Token", function () {
    it("Validator should be able to create token", async () => {
      const wrappedTokenName: string = "BridgeToken";
      const wrappedTokenSymbol: string = "bTKN";
      const signatures: string[] = [];

      const wrappedTokenFactoryAddress: string =
        await bridge.wrappedTokenFactory();
      const factory: Contract = await ethers.getContractAtFromArtifact(
        WrappedTokenFactoryABI,
        wrappedTokenFactoryAddress,
        deployer
      );

      await expect(
        bridge
          .connect(validator)
          .createToken(wrappedTokenName, wrappedTokenSymbol, signatures)
      ).to.emit(factory, "TokenCreated").and.not.reverted;
    });

    it("Should not allow create token with not registered validator", async () => {
      const wrappedTokenName: string = "BridgeToken";
      const wrappedTokenSymbol: string = "bTKN";

      await expect(
        bridge.connect(user).createToken(wrappedTokenName, wrappedTokenSymbol)
      ).to.be.revertedWith("Validator not registered");
    });
  });

  describe("Claim Fees", function () {
    it("Should not allow claim fees when there are not any accumulated", async () => {
      await expect(bridge.connect(validator).claimFees()).to.be.revertedWith(
        "No accumulated fees to claim"
      );
    });

    it("Should not allow calim fees with unrecognized validator", async () => {
      await expect(
        bridge.connect(unregisteredValidator).claimFees()
      ).to.be.revertedWith("Validator not registered");
    });
  });
});
