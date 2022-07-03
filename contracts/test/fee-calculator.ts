import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory, Signer, Wallet } from "ethers";
import { expect } from "chai";
import { deployContract, MockProvider } from "ethereum-waffle";
import FeeCalculatorContracFactoryABI from "../artifacts/contracts/FeeCalculator.sol/FeeCalculator.json";

describe("TokenFactory", function () {
  let provider: MockProvider;
  let deployer: Wallet;
  let validator: Wallet;
  let feeCalculatorContract: Contract;

  beforeEach(async function () {
    provider = new MockProvider();
    [deployer, validator] = provider.getWallets();  
    feeCalculatorContract = await deployContract(deployer, FeeCalculatorContracFactoryABI, [5000000000000000]); 
  });

  it('Should set initial fee on deploy to 0.005 ETH', async function () {
    const expectedFee: BigNumber = ethers.utils.parseEther("0.005");
    expect(await feeCalculatorContract.serviceFee())
      .to.equal(expectedFee);
  });

  
  it('Should set fee after once deployed', async function () {
    const newFee: BigNumber = ethers.utils.parseEther("0.01");
    await feeCalculatorContract.setServiceFee(newFee)
    expect(await feeCalculatorContract.serviceFee())
      .to.equal(newFee);
  });

  it('Should accure fee', async function () {
    const accumulatedFees: BigNumber = await feeCalculatorContract.accumulatedFees(validator.address);
    const serviceFee: BigNumber = await feeCalculatorContract.serviceFee();

    expect(await feeCalculatorContract.accumulatedFees(validator.address))
        .to.equal(ethers.utils.parseEther("0"));
    await feeCalculatorContract.accureFees(validator.address);
    expect(await feeCalculatorContract.accumulatedFees(validator.address))
        .to.equal(accumulatedFees.add(serviceFee));
  });

  it('Should claim fee', async function () {
    const accumulatedFees: BigNumber = await feeCalculatorContract.accumulatedFees(validator.address);

    expect(await feeCalculatorContract.claim(validator.address))
        .to.emit(feeCalculatorContract, "Claim")
        .withArgs(validator.address, accumulatedFees);
    expect(await feeCalculatorContract.accumulatedFees(validator.address))
        .to.equal(ethers.utils.parseEther("0"));
  });
});