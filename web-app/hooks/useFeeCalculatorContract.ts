import FEE_CALCULATOR_ABI from "../contracts/FeeCalculator.json";
import type { FeeCalculator } from "../'./contracts/types'";
import useContract from "./useContract";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { FEE_CALCULATOR } from "../constants";
import { tryGetContractAddress } from "../utils/helper-functions";

export default function useFeeCalculatorContract(contractAddress?: string) {
  if (!contractAddress) {
    const { chainId } = useWeb3React<Web3Provider>();
    const feeCalculatorAddress: string = tryGetContractAddress(
      chainId,
      FEE_CALCULATOR
    );
    return useContract<FeeCalculator>(
      feeCalculatorAddress,
      FEE_CALCULATOR_ABI.abi
    );
  }
  return useContract<FeeCalculator>(contractAddress, FEE_CALCULATOR_ABI.abi);
}
