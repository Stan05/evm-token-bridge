import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { ReactNode } from "react";
import {
  BridgeSupportedChain,
  BridgeSupportedToken,
} from "../../constants/networks";
import { formatEtherscanLink, parseBalance } from "../../util";
import ClaimableTransactionComponent from "./ClaimableTransaction";
import PendingTransaction from "./PendingTransaction";

export interface ITransaction {
  bridgeTxHash: string;
  claimTxHash: string;
  txType: string;
  txStatus: string;
  sourceChain: BridgeSupportedChain;
  targetChain: BridgeSupportedChain;
  amount: number;
  sourceToken: BridgeSupportedToken;
  targetToken: BridgeSupportedToken;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionComponent = ({
  transaction,
  transactionChanged,
}: {
  transaction: ITransaction;
  transactionChanged: () => void;
}) => {
  const { chainId } = useWeb3React<Web3Provider>();

  const baseTransactionComponent = (transaction: ITransaction) => {
    return (
      <>
        {transaction.createdAt} {" | "}
        <a
          {...{
            className: "btn-link",
            style: { ...{ color: "blue" } },
            href: formatEtherscanLink("Transaction", [
              transaction.sourceChain.chainId,
              transaction.bridgeTxHash,
            ]),
            target: "_blank",
            rel: "noopener noreferrer",
          }}
        >
          {transaction.sourceChain.chainName}
        </a>
        {tokenBalance(
          transaction.amount,
          transaction.sourceToken.decimals,
          transaction.sourceToken.symbol
        )}
        {" -> "}
        <a
          {...{
            className: "btn-link",
            style: { ...{ color: "blue" } },
            href: formatEtherscanLink("Transaction", [
              transaction.targetChain.chainId,
              transaction.claimTxHash,
            ]),
            target: "_blank",
            rel: "noopener noreferrer",
          }}
        >
          {transaction.targetChain.chainName}
        </a>
        {tokenBalance(
          transaction.amount,
          transaction.targetToken.decimals,
          transaction.targetToken.symbol
        )}
        {" | "} {getMessageForTxStatus(transaction)}
      </>
    );
  };

  const tokenBalance = (amount: number, decimals: number, symbol: string) => {
    return (
      <>
        {" "}
        {parseBalance(amount, decimals)}
        {symbol}
      </>
    );
  };

  const claimedTransaction = (transaction: ITransaction) => {
    return (
      <div className="transaction-history">
        {{ ...baseTransactionComponent(transaction) }}
      </div>
    );
  };

  const claimableTransactionComponent = (transaction: ITransaction) => {
    return (
      <ClaimableTransactionComponent
        transaction={transaction}
        baseTransactionComponent={baseTransactionComponent}
        transactionChanged={transactionChanged}
      ></ClaimableTransactionComponent>
    );
  };

  const pendingTransactionComponent = (transaction: ITransaction) => {
    return (
      <PendingTransaction
        transaction={transaction}
        baseTransactionComponent={baseTransactionComponent}
        transactionChanged={transactionChanged}
      ></PendingTransaction>
    );
  };

  const renderTransaction = (transaction: ITransaction): ReactNode => {
    if (
      (transaction.txStatus === "WAITING_CLAIM" ||
        transaction.txStatus === "WAITING_FINALITY") &&
      transaction.targetChain.chainId === chainId
    ) {
      return claimableTransactionComponent(transaction);
    } else if (
      (transaction.txStatus === "WAITING_CLAIM" ||
        transaction.txStatus === "WAITING_FINALITY") &&
      transaction.targetChain.chainId != chainId
    ) {
      return pendingTransactionComponent(transaction);
    }
    return claimedTransaction(transaction);
  };

  const getMessageForTxStatus = (transaction: ITransaction): string => {
    if (
      transaction.txStatus === "WAITING_CLAIM" &&
      transaction.targetChain.chainId === chainId
    ) {
      return "Waiting Claim";
    } else if (
      transaction.txStatus === "WAITING_CLAIM" &&
      transaction.targetChain.chainId != chainId
    ) {
      return "Switch chains to Claim";
    } else if (transaction.txStatus === "CLAIMED") {
      return "Claimed";
    } else if (transaction.txStatus === "WAITING_FINALITY") {
      return "Waiting cofirmation";
    }
  };

  return renderTransaction(transaction);
};

export default TransactionComponent;
