import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import { BigNumber } from "ethers";
import BridgeStarted from "./BridgeStarted";
import BridgeSetup from "./BridgeSetup";

export enum BridgeTxType {
  LOCK,
  BURN,
}

export type BridgeFormData = {
  sourceChain: number;
  targetChain: number;
  sourceToken: string;
  bridgeAmount: BigNumber;
  bridgeAmountInput: number;
  bridgeTxType: BridgeTxType;
};

const initialState: BridgeFormData = {
  sourceChain: undefined,
  targetChain: undefined,
  sourceToken: undefined,
  bridgeAmount: undefined,
  bridgeAmountInput: undefined,
  bridgeTxType: undefined,
};

const Bridge = () => {
  const { chainId: connectedChain } = useWeb3React<Web3Provider>();

  // Bridge Form Data
  const [bridgeFormData, setBridgeFormData] = useState<BridgeFormData>();
  const [lockTxHash, setBridgeTxHash] = useState<string>();
  const [hasBridgingStarted, setHasBridgingStarted] = useState<boolean>(false);

  const requestNetworkSwitch = async (selectedNetwork: number) => {
    if (!window.ethereum) throw new Error("No wallet found");
    if (selectedNetwork !== connectedChain) {
      try {
        await window.ethereum
          .request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${Number(selectedNetwork).toString(16)}` }],
          })
          .catch((error) => {
            console.log(error);
            setHasBridgingStarted(false);
          })
          .finally(() => {
            setBridgeFormData({
              ...bridgeFormData,
              sourceChain: selectedNetwork,
            });
          });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            // TODO: Add support for adding chain to metamask
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xf00",
                  chainName: "...",
                  rpcUrls: ["https://..."] /* ... */,
                },
              ],
            });
          } catch (addError) {
            console.log("Error on adding new chain");
          }
        }
      }
    }
  };
  return (
    <div className="bridge-wrapper">
      {!hasBridgingStarted ? (
        <BridgeSetup
          bridgeFormData={bridgeFormData}
          setBridgeFormData={setBridgeFormData}
          setHasBridgingStarted={setHasBridgingStarted}
          setBridgeTxHash={setBridgeTxHash}
          requestNetworkSwitch={requestNetworkSwitch}
        ></BridgeSetup>
      ) : (
        <BridgeStarted
          bridgeFormData={bridgeFormData}
          bridgeTxHash={lockTxHash}
          requestNetworkSwitch={requestNetworkSwitch}
          setHasBridgingStarted={(value) => {
            setHasBridgingStarted(value);
            setBridgeFormData({
              ...initialState,
              sourceChain: connectedChain,
            });
          }}
        ></BridgeStarted>
      )}
    </div>
  );
};

export default Bridge;
