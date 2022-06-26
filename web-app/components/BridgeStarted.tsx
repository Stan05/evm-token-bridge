import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useBridgeContract from "../hooks/useBridgeContract";
import { tryGetContractAddress } from "../utils/helper-functions";
import { BigNumber, Contract, ethers } from "ethers";
import { useInterval } from "use-interval";
import { formatEtherscanLink, shortenHex } from "../util";
import { BRIDGE } from "../constants";
import useFeeCalculatorContract from "../hooks/useFeeCalculatorContract";
import axios from "axios";

interface BridgeStartedInterface {
  targetChain: number;
  bridgeAmount: BigNumber;
  bridgeTxHash: string;
  requestNetworkSwitch: (chainId: number) => void;
  setHasBridgingStarted: (chainId: boolean) => void;
}

const BridgeStarted = ({
  targetChain,
  bridgeAmount,
  bridgeTxHash,
  requestNetworkSwitch,
  setHasBridgingStarted,
}: BridgeStartedInterface) => {
  const {
    chainId: connectedChain,
    account,
    library,
  } = useWeb3React<Web3Provider>();
  useFeeCalculatorContract();
  const targetBridgeAddress: string = tryGetContractAddress(
    targetChain,
    BRIDGE
  );
  const targetBridge = useBridgeContract(targetBridgeAddress);

  const [areTokensClaimable, setAreTokensClaimable] = useState<boolean>(false);
  const [isBridgingTxMined, setIsBridgingTxMined] = useState<boolean>(false);
  const [claimTxHash, setClaimTxHash] = useState<string>();
  const [targetToken, setTargetToken] = useState<string>();
  const [validatorSignatures, setValidatorSignatures] = useState<string[]>([]);

  const claimBridgeTransaction = async () => {
    await targetBridge
      .mint(account, bridgeAmount, targetToken, validatorSignatures, {
        value: ethers.utils.parseEther("0.005"),
      })
      .then((result) => {
        console.log("Success mint ", result);
        setClaimTxHash(result.hash);
        setAreTokensClaimable(false);
        setHasBridgingStarted(false);
      })
      .catch((error) => {
        console.log("Error mint", error);
      });
  };

  const isTransactionMined = async (
    transactionHash: string
  ): Promise<boolean> => {
    const txReceipt = await library.getTransactionReceipt(transactionHash);
    console.log(txReceipt);
    if (txReceipt && txReceipt.blockNumber) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (areTokensClaimable) {
      requestNetworkSwitch(targetChain);
    }
  }, [areTokensClaimable]);

  useInterval(async () => {
    if (bridgeTxHash && !isBridgingTxMined) {
      // check is the tx is mined
      console.log("Bridging started, polling for tx mined");
      const isTxMined = await isTransactionMined(bridgeTxHash);
      setIsBridgingTxMined(isTxMined);
    }
    if (isBridgingTxMined && !areTokensClaimable) {
      // after tx is mined, waits for validator signatures
      axios
        .get("http://localhost:8080/validator/lock/" + bridgeTxHash)
        .then((response) => {
          if (response?.data?.signatures) {
            console.log("Received signature");
            setValidatorSignatures(response.data.signatures);
            setTargetToken(response.data.targetToken);
            setAreTokensClaimable(true);
          }
        });
    }
  }, 1000);

  return (
    <div className="bridge-started">
      {!areTokensClaimable ? (
        <p className="waiting">Waiting for your transaction to be mined.</p>
      ) : (
        <p>You can claim your tokens after you connect to the target chain.</p>
      )}
      {bridgeTxHash && (
        <p>
          You can check it at
          <a
            {...{
              className: "href",
              href: formatEtherscanLink("Transaction", [
                connectedChain,
                bridgeTxHash,
              ]),
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            {shortenHex(bridgeTxHash)}
          </a>
        </p>
      )}
      {claimTxHash && (
        <p>
          Your tokens are being claimed with tx
          <a
            {...{
              className: "href",
              href: formatEtherscanLink("Transaction", [
                connectedChain,
                claimTxHash,
              ]),
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            {shortenHex(bridgeTxHash)}
          </a>
        </p>
      )}
      <button
        disabled={!areTokensClaimable}
        onClick={() => claimBridgeTransaction()}
      >
        Claim
      </button>
    </div>
  );
};

export default BridgeStarted;