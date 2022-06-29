import SupportedTokenRepository from "../repository/models/supported-token-repository";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import ConfigBuilder from "../config/config-builder";
import { Contract } from "ethers";
import { ContractName } from "../config";

class SupportedTokenService {
  configBuilder: ConfigBuilder = new ConfigBuilder();
  supportedTokenRepository: SupportedTokenRepository =
    new SupportedTokenRepository();

  async EnsureTokenIsSupported(chainId: number, token: String): Promise<void> {
    if (await this.isTokenNotSupported(chainId, token)) {
      console.log(
        "Token %s on chain %d is not supported, creating it in db",
        token,
        chainId
      );
      const tokenContract: Contract = this.configBuilder.GetContract(
        chainId,
        ContractName.ERC20_TOKEN
      );
      this.supportedTokenRepository.CreateSupportedToken({
        chainId: chainId,
        token: token,
        name: await tokenContract.name(),
        decimals: await tokenContract.decimals(),
        symbol: await tokenContract.symbol(),
      });
    }
  }

  private async isTokenNotSupported(
    chainId: number,
    token: String
  ): Promise<boolean> {
    return (
      (await this.supportedTokenRepository.GetSupportedToken(chainId, token)) ==
      null
    );
  }
}

export default SupportedTokenService;
