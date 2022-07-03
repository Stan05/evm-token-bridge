import ERC20Token_ABI from "../contracts/ERC20Token.json";
import type { ERC20Token } from "../'./contracts/types'/ERC20Token";
import useContract from "./useContract";

export default function useTokenContract(tokenAddress?: string) {
  return useContract<ERC20Token>(tokenAddress, ERC20Token_ABI);
}
