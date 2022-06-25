import FEE_CALCULATOR_ABI from "../contracts/FeeCalculator.json";
import type { FeeCalculator } from "../'./contracts/types'";
import useContract from "./useContract";

export default function useFeeCalculatorContract(contractAddress?: string) {
  return useContract<FeeCalculator>(contractAddress, FEE_CALCULATOR_ABI);
}
