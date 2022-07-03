import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { useState } from "react";
import useInterval from "use-interval";
import useBridgeContract from "../../hooks/useBridgeContract";
import { BridgeTxType } from "../Bridge";
import { ITransaction } from "./TransactionComponent";

const ClaimableTransactionComponent = ({
  transaction,
  baseTransactionComponent,
  transactionChanged,
}: {
  transaction: ITransaction;
  baseTransactionComponent: (transaction: ITransaction) => JSX.Element;
  transactionChanged: () => void;
}) => {
  const { account } = useWeb3React<Web3Provider>();
  const bridge = useBridgeContract();
  const [validatorSignatures, setValidatorSignatures] = useState<string[]>();
  const [areTokensClaiming, setAreTokensClaiming] = useState<boolean>(false);

  const claimBridgeTransaction = async (transaction: ITransaction) => {
    const bridgeTxType: BridgeTxType =
      transaction.txType === BridgeTxType.LOCK
        ? BridgeTxType.LOCK
        : BridgeTxType.BURN;

    setAreTokensClaiming(true);
    if (bridgeTxType == BridgeTxType.LOCK) {
      console.log("Minting");
      await bridge
        .mint(
          account,
          transaction.amount,
          transaction.targetToken.token,
          validatorSignatures
        )
        .then((result) => {
          console.log("Success mint ", result);
          axios.post("http://localhost:8080/transactions/lock/claim", {
            sourceChainId: transaction.sourceChain.chainId,
            targetChainId: transaction.targetChain.chainId,
            bridgeTxHash: transaction.bridgeTxHash,
            claimTxHash: result.hash,
          });
          transaction.claimTxHash = result.hash;
        })
        .catch((error) => {
          console.log("Error mint", error);
        })
        .finally(() => {
          setAreTokensClaiming(false);
          setValidatorSignatures(undefined);
        });
    } else if (bridgeTxType == BridgeTxType.BURN) {
      console.log("Releasing");
      await bridge
        .release(
          account,
          transaction.amount,
          transaction.targetToken.token,
          validatorSignatures
        )
        .then((result) => {
          console.log("Success release ", result);
          axios.post("http://localhost:8080/transactions/burn/claim", {
            sourceChainId: transaction.sourceChain.chainId,
            targetChainId: transaction.targetChain.chainId,
            bridgeTxHash: transaction.bridgeTxHash,
            claimTxHash: result.hash,
          });
          transaction.claimTxHash = result.hash;
        })
        .catch((error) => {
          console.log("Error mint", error);
        })
        .finally(() => {
          setAreTokensClaiming(false);
          setValidatorSignatures(undefined);
        });
    }
  };

  useInterval(async () => {
    if (transaction.txStatus === "WAITING_CLAIM" && !validatorSignatures) {
      // after tx is mined, waits for validator signatures
      const url: string =
        transaction.txType == BridgeTxType.LOCK
          ? "http://localhost:8080/validator/lock/"
          : "http://localhost:8080/validator/burn/";
      axios
        .get(
          url +
            transaction.sourceChain.chainId +
            "/" +
            transaction.targetChain.chainId +
            "/" +
            transaction.bridgeTxHash
        )
        .then((response) => {
          if (response?.data?.signatures) {
            console.log("Received signature");
            setValidatorSignatures(response.data.signatures);
          }
        });
    }
  }, 3000);

  return (
    <div
      {...{
        className: !validatorSignatures
          ? "transaction-history waiting"
          : "transaction-history",
      }}
    >
      {{ ...baseTransactionComponent(transaction) }}
      {" | "}
      <button
        disabled={!validatorSignatures || areTokensClaiming}
        onClick={() => claimBridgeTransaction(transaction)}
      >
        Claim
      </button>
    </div>
  );
};

export default ClaimableTransactionComponent;
