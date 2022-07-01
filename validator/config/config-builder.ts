import { ContractName, networks } from "../config";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { Contract, ContractInterface, ethers } from "ethers";
import ERC20ABI from "../abis/ERC20Token.json";
import BridgeABI from "../abis/Bridge.json";
import GovernanceABI from "../abis/Governance.json";
import RegistryABI from "../abis/Registry.json";

class ConfigBuilder {
  GetChainProvider(chainId: number): StaticJsonRpcProvider {
    const rpcUrl: string = this.getNetworkConfig(chainId)?.url ?? "";

    return new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  }

  GetContractAt(
    chainId: number,
    address: string,
    contractName: ContractName
  ): Contract {
    return new ethers.Contract(
      address,
      this.getContractAbi(contractName),
      this.GetChainProvider(chainId)
    );
  }

  GetContract(chainId: number, contractName: ContractName): Contract {
    return new ethers.Contract(
      this.getContractAddress(chainId, contractName),
      this.getContractAbi(contractName),
      this.GetChainProvider(chainId)
    );
  }

  private getNetworkConfig(chainId: number) {
    return networks.find((network) => network.chainId === chainId);
  }

  private getContractAddress(
    chainId: number,
    contractName: ContractName
  ): string {
    return (
      this.getNetworkConfig(chainId)?.contracts.find(
        (contract) => contract.name === contractName
      )?.address ?? ""
    );
  }

  private getContractAbi(contractName: ContractName): ContractInterface {
    switch (contractName) {
      case ContractName.ERC20_TOKEN:
        return ERC20ABI.abi;
      case ContractName.BRIDGE:
        return BridgeABI.abi;
      case ContractName.GOVERNANCE:
        return GovernanceABI.abi;
      default:
        return RegistryABI.abi;
    }
    //default to registry
  }
}

export default ConfigBuilder;
