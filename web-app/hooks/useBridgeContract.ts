import BRIDGE_ABI from "../contracts/Bridge.json";
import type { Bridge } from "../'./contracts/types'";
import useContract from "./useContract";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { BRIDGE } from "../constants";
import { tryGetContractAddress } from "../utils/helper-functions";

export default function useBridgeContract(contractAddress?: string) {
  if (!contractAddress) {
    const { chainId } = useWeb3React<Web3Provider>();
    const bridgeAddress: string = tryGetContractAddress(chainId, BRIDGE);
    return useContract<Bridge>(bridgeAddress, BRIDGE_ABI.abi);
  }
  return useContract<Bridge>(contractAddress, BRIDGE_ABI.abi);
}
