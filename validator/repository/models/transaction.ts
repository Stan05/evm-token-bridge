import { BigNumber } from "ethers";
import mongoose from "mongoose";

enum TransactionType {
  BURN = "BURN",
  LOCK = "LOCK",
  UNDEFINED = "UNDEFINED",
}

enum TransactionStatus {
  INITIATED = "INITIATED",
  WAITING_FINALITY = "WAITING_FINALITY",
  WAITING_CLAIM = "WAITING_CLAIM",
  CLAIMED = "CLAIMED",
  FAILED = "FAILED",
}

interface Transaction {
  bridgeTxHash: string;
  claimTxHash?: string;
  txType: TransactionType;
  txStatus: TransactionStatus;
  from: string;
  sourceChainId: number;
  targetChainid: number;
  amount: BigNumber;
  sourceToken: string;
  targetToken: string;
  signatures?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new mongoose.Schema<Transaction>({
  bridgeTxHash: { type: String, required: true, unique: true },
  claimTxHash: String,
  txType: {
    type: String,
    enum: Object.values(TransactionType),
    required: true,
    default: TransactionType.UNDEFINED,
  },
  txStatus: {
    type: String,
    enum: Object.values(TransactionStatus),
    required: true,
    default: TransactionStatus.INITIATED,
  },
  from: { type: String, required: true },
  sourceChainId: { type: Number, required: true },
  targetChainid: { type: Number, required: true },
  sourceToken: { type: String, required: true },
  targetToken: { type: String, required: true },
  amount: { type: String, required: true },
  signatures: [String],
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
});

const TransactionModel = mongoose.model("Transaction", TransactionSchema);

export { TransactionType, TransactionStatus, Transaction, TransactionModel };
