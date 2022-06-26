import WRAPPED_TOKEN_FACTORY_ABI from "../contracts/WrappedTokenFactory.json";
import type { WrappedTokenFactory } from "../'./contracts/types'";
import useContract from "./useContract";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { WRAPPED_TOKEN_FACTORY } from "../constants";
import { tryGetContractAddress } from "../utils/helper-functions";

export default function useWrappedTokenFactory(contractAddress?: string) {
  if (!contractAddress) {
    const { chainId } = useWeb3React<Web3Provider>();
    const registryAddress: string = tryGetContractAddress(
      chainId,
      WRAPPED_TOKEN_FACTORY
    );
    return useContract<WrappedTokenFactory>(
      registryAddress,
      WRAPPED_TOKEN_FACTORY_ABI.abi
    );
  }
  return useContract<WrappedTokenFactory>(
    contractAddress,
    WRAPPED_TOKEN_FACTORY_ABI.abi
  );
}
