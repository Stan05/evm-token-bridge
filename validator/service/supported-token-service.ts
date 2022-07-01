import SupportedTokenRepository from "../repository/models/supported-token-repository";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import ConfigBuilder from "../config/config-builder";
import { Contract } from "ethers";
import { ContractName } from "../config";

class SupportedTokenService {
  configBuilder: ConfigBuilder = new ConfigBuilder();
  supportedTokenRepository: SupportedTokenRepository =
    new SupportedTokenRepository();

  async GetSupportedTokens(chainId: number) {
    return this.supportedTokenRepository.GetSupportedTokens(chainId);
  }

  async GetSupportedToken(chainId: number, token: string) {
    return this.supportedTokenRepository.GetSupportedToken(chainId, token);
  }

  async CreateSupportedToken(chainId: number, tokenAddress: string) {
    if (chainId && tokenAddress) {
      await this.EnsureTokenIsSupported(chainId, tokenAddress);
      return this.GetSupportedToken(chainId, tokenAddress);
    } else {
      throw new Error("Chain id or token address not provided");
    }
  }

  async EnsureTokenIsSupported(
    chainId: number,
    tokenAddress: string
  ): Promise<void> {
    if (await this.isTokenNotSupported(chainId, tokenAddress)) {
      console.log(
        "Token %s on chain %d is not supported, creating it in db",
        tokenAddress,
        chainId
      );
      const tokenContract: Contract = this.configBuilder.GetContractAt(
        chainId,
        tokenAddress,
        ContractName.ERC20_TOKEN
      );
      this.supportedTokenRepository.CreateSupportedToken({
        chainId: chainId,
        token: tokenAddress,
        name: await tokenContract.name(),
        decimals: await tokenContract.decimals(),
        symbol: await tokenContract.symbol(),
      });
    }
  }

  private async isTokenNotSupported(
    chainId: number,
    token: string
  ): Promise<boolean> {
    return (
      (await this.supportedTokenRepository.GetSupportedToken(chainId, token)) ==
      null
    );
  }
}

export default SupportedTokenService;
