import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import {
  BridgeSupportedChain,
  bridgeSupportedChains,
  BridgeSupportedToken,
} from "../constants/networks";
import { SelectSearchOption } from "react-select-search";
import SelectSearch from "react-select-search";
import NumberFormat from "react-number-format";
import useBridgeContract from "../hooks/useBridgeContract";
import {
  getUserPermit,
  tryGetContractAddress,
} from "../utils/helper-functions";
import { BigNumber, Contract, ethers } from "ethers";
import ERC20Token_ABI from "../contracts/ERC20Token.json";
import BRIDGE_ABI from "../contracts/Bridge.json";
import { useInterval } from "use-interval";
import { formatEtherscanLink, shortenHex } from "../util";
import { BRIDGE } from "../constants";
import BridgeStarted from "./BridgeStarted";
import BridgeSetup from "./BridgeSetup";

export type BridgeFormData = {
  sourceChain: number;
  targetChain: number;
  sourceToken: string;
  bridgeAmount: BigNumber;
  bridgeAmountInput: number;
};

const initialState: BridgeFormData = {
  sourceChain: undefined,
  targetChain: undefined,
  sourceToken: undefined,
  bridgeAmount: undefined,
  bridgeAmountInput: undefined,
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
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${Number(selectedNetwork).toString(16)}` }],
        });
        setBridgeFormData({
          ...bridgeFormData,
          sourceChain: selectedNetwork,
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
          targetChain={bridgeFormData.targetChain}
          bridgeAmount={bridgeFormData.bridgeAmount}
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
