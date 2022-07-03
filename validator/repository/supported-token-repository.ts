import { SupportedToken, SupportedTokenModel } from "./models/supported-token";

//Dealing with database operations
class SupportedTokenRepository {
  async CreateSupportedToken(
    supportedToken: SupportedToken
  ): Promise<SupportedToken> {
    const supportedTokenModel = new SupportedTokenModel(supportedToken);
    const supportedTokenResult: SupportedToken =
      await supportedTokenModel.save();
    return supportedTokenResult;
  }

  async GetSupportedToken(
    chainId: number,
    token: String
  ): Promise<SupportedToken | null> {
    return await SupportedTokenModel.findOne({
      chainId: chainId,
      token: { $regex: "^" + token + "$", $options: "i" },
    });
  }
  async GetSupportedTokens(chainId: number): Promise<SupportedToken[] | null> {
    return await SupportedTokenModel.find({
      chainId: chainId,
    });
  }
}

export default SupportedTokenRepository;
