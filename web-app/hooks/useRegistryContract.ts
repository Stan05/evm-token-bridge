import REGISTRY_ABI from "../contracts/Registry.json";
import type { Registry } from "../'./contracts/types'";
import useContract from "./useContract";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { REGISTRY } from "../constants";
import { tryGetContractAddress } from "../utils/helper-functions";

export default function useRegistruContract(contractAddress?: string) {
  if (!contractAddress) {
    const { chainId } = useWeb3React<Web3Provider>();
    const registryAddress: string = tryGetContractAddress(chainId, REGISTRY);
    return useContract<Registry>(registryAddress, REGISTRY_ABI.abi);
  }
  return useContract<Registry>(contractAddress, REGISTRY_ABI.abi);
}
