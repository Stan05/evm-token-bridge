import mongoose from "mongoose";

interface SupportedToken {
  chainId: number;
  token: String;
  name?: String;
  symbol?: String;
  decimals?: number;
}
const SupportedTokenSchema = new mongoose.Schema<SupportedToken>({
  chainId: { type: Number, required: true },
  token: { type: String, required: true },
  name: String,
  symbol: String,
  decimals: Number,
});
const SupportedTokenModel = mongoose.model(
  "SupportedToken",
  SupportedTokenSchema
);

export { SupportedToken, SupportedTokenModel };
