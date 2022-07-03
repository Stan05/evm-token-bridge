import {
  TransactionReceipt,
  TransactionResponse,
  Web3Provider,
} from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import {
  BridgeSupportedChain,
  bridgeSupportedChains,
  BridgeSupportedToken,
} from "../constants/networks";
import { SelectedOptionValue, SelectSearchOption } from "react-select-search";
import SelectSearch from "react-select-search";
import NumberFormat from "react-number-format";
import useBridgeContract from "../hooks/useBridgeContract";
import { getUserPermit, requestNetworkSwitch } from "../utils/helper-functions";
import { BigNumber, BigNumberish, Contract, ethers } from "ethers";
import ERC20Token_ABI from "../contracts/ERC20Token.json";
import BasicERC20_ABI from "../contracts/ERC20.json";
import useWrappedTokenFactory from "../hooks/useWrappedTokenFactory";
import axios from "axios";
import AddTokenComponent from "./AddTokenComponent";
import { parseBalance } from "../util";
import { parseUnits } from "ethers/lib/utils";
import useFeeCalculatorContract from "../hooks/useFeeCalculatorContract";

export enum BridgeTxType {
  LOCK = "LOCK",
  BURN = "BURN",
}

export type BridgeFormData = {
  sourceChain: number;
  targetChain: number;
  sourceToken: string;
  bridgeAmount: BigNumber;
  bridgeAmountInput: number;
  bridgeTxType: BridgeTxType;
  isPermit: boolean;
  serviceFee: BigNumber;
};

const initialState: BridgeFormData = {
  sourceChain: undefined,
  targetChain: undefined,
  sourceToken: undefined,
  bridgeAmount: undefined,
  bridgeAmountInput: 0,
  bridgeTxType: undefined,
  isPermit: false,
  serviceFee: undefined,
};
const ADD_TOKEN_SELECT_KEY: string = "add-token-key";

const Bridge = () => {
  const {
    chainId: connectedChain,
    account,
    library,
  } = useWeb3React<Web3Provider>();
  const sourceBridge = useBridgeContract();
  const sourceWrappedTokenFactory = useWrappedTokenFactory();
  const feeCalculator = useFeeCalculatorContract();

  // Bridge Inputs Data
  const [supportedSourceChains, setSupportedSourceChains] = useState<
    SelectSearchOption[]
  >([]);
  const [supportedTargetChains, setSupportedTargetChains] = useState<
    SelectSearchOption[]
  >([]);
  const [supportedSourceTokens, setSupportedSourceTokens] = useState<
    SelectSearchOption[]
  >([]);

  // Bridge State
  const [bridgeFormData, setBridgeFormData] =
    useState<BridgeFormData>(initialState);
  const [hasBridgingStarted, setHasBridgingStarted] = useState<boolean>(false);
  const [sourceTokenContract, setSourceTokenContract] = useState<Contract>();
  const [availabeSourceTokenAmount, setAvailableSourceTokenAmount] =
    useState<BigNumber>();
  const [selectedSourceTokenDetails, setSelectedSourceTokenDetails] =
    useState<BridgeSupportedToken>();
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [addTokenModalShowed, setAddTokenModalShowed] =
    useState<boolean>(false);

  const initializeInputData = async (chainId: number) => {
    setBridgeFormData({
      ...initialState,
      sourceChain: chainId,
      serviceFee: await feeCalculator.serviceFee(),
    });
    // Initialize supported chains
    const selectableSourceChains: SelectSearchOption[] =
      bridgeSupportedChains.map((supportedChain) =>
        fromSupportedChain(supportedChain)
      );
    setSupportedSourceChains(selectableSourceChains);
    setSupportedTargetChains(
      selectableSourceChains.filter(
        (supportedChain) => supportedChain.value !== chainId
      )
    );

    setSelectedSourceTokenDetails(undefined);
    setAvailableSourceTokenAmount(undefined);
    setHasBridgingStarted(false);
    updateSupportedSourceTokens(chainId);
  };

  const handleSourceTokenChanged = async (sourceToken: string) => {
    let isPermit: boolean = false;
    let tokenContract: Contract;
    try {
      tokenContract = new Contract(
        sourceToken,
        ERC20Token_ABI.abi,
        library.getSigner(account)
      );
      await tokenContract.estimateGas.nonces(account);
      isPermit = true;
    } catch (error) {
      console.log(
        "Choosen token is not supportig permit, defaulting to basic ERC20"
      );
      tokenContract = new Contract(
        sourceToken,
        BasicERC20_ABI.abi,
        library.getSigner(account)
      );
    }

    setAvailableSourceTokenAmount(await tokenContract.balanceOf(account));
    setSourceTokenContract(tokenContract);
    setSelectedSourceTokenDetails({
      name: await tokenContract.name(),
      symbol: await tokenContract.symbol(),
      token: tokenContract.address,
      decimals: await tokenContract.decimals(),
    });
    setBridgeFormData({
      ...bridgeFormData,
      bridgeTxType: (await isWrappedTokenSelected(sourceToken))
        ? BridgeTxType.BURN
        : BridgeTxType.LOCK,
      sourceToken: sourceToken,
      bridgeAmount: undefined,
      bridgeAmountInput: undefined,
      isPermit: isPermit,
    });
  };

  const sendBridgeTransaction = async () => {
    console.log(bridgeFormData);
    if (isFormValid) {
      console.log(
        "Sending bridge %s transaction from chain %d and token %s with amount %f to chain %d for a fee %d",
        bridgeFormData.bridgeTxType,
        bridgeFormData.sourceChain,
        bridgeFormData.sourceToken,
        bridgeFormData.bridgeAmountInput,
        bridgeFormData.targetChain,
        bridgeFormData.serviceFee
      );
      if (bridgeFormData.bridgeTxType == BridgeTxType.LOCK) {
        await sendLockTransaction();
      } else if (bridgeFormData.bridgeTxType == BridgeTxType.BURN) {
        await sendBurnTransaction();
      }
    }
  };

  const sendLockTransaction = async () => {
    if (bridgeFormData.isPermit) {
      await getUserPermit(
        account,
        sourceBridge.address,
        sourceTokenContract,
        window.ethereum,
        bridgeFormData.bridgeAmount
      ).then(async (signature) => {
        await sourceBridge
          .lockWithPermit(
            bridgeFormData.targetChain,
            bridgeFormData.sourceToken,
            bridgeFormData.bridgeAmount,
            signature.deadline,
            signature.v,
            signature.r,
            signature.s,
            {
              value: bridgeFormData.serviceFee,
            }
          )
          .then((tx) => {
            console.log("Successful Lock with permit");
            setHasBridgingStarted(true);
          })
          .catch((error) => {
            console.log("Tx Failed");
            setHasBridgingStarted(false);
          });
      });
    } else {
      setHasBridgingStarted(true);
      const approveResponse: TransactionResponse =
        await sourceTokenContract.approve(
          sourceBridge.address,
          bridgeFormData.bridgeAmount
        );
      const approveReceipt: TransactionReceipt = await approveResponse.wait();
      if (approveReceipt.status == 1) {
        await sourceBridge
          .lock(
            bridgeFormData.targetChain,
            bridgeFormData.sourceToken,
            bridgeFormData.bridgeAmount,
            {
              value: bridgeFormData.serviceFee,
            }
          )
          .then((tx) => {
            console.log("Successful Lock without permit");
            setHasBridgingStarted(true);
          })
          .catch((error) => {
            console.log("Tx Failed");
          })
          .finally(() => {
            setHasBridgingStarted(false);
          });
      } else {
        setHasBridgingStarted(false);
      }
    }
  };

  const sendBurnTransaction = async () => {
    await getUserPermit(
      account,
      sourceBridge.address,
      sourceTokenContract,
      window.ethereum,
      bridgeFormData.bridgeAmount
    ).then(async (signature) => {
      await sourceBridge
        .burn(
          bridgeFormData.targetChain,
          bridgeFormData.sourceToken,
          bridgeFormData.bridgeAmount,
          signature.deadline,
          signature.v,
          signature.r,
          signature.s,
          {
            value: bridgeFormData.serviceFee,
          }
        )
        .then((tx) => {
          console.log(tx);
          setHasBridgingStarted(true);
        })
        .catch((error) => {
          console.log("Tx Failed");
          setHasBridgingStarted(false);
        });
    });
  };

  const isWrappedTokenSelected = async (
    sourceToken: string
  ): Promise<boolean> => {
    const token = await sourceWrappedTokenFactory.lookupTokenContract(
      sourceToken
    );
    return token != ethers.constants.AddressZero;
  };

  const updateSupportedSourceTokens = (chainId) => {
    axios.get("http://localhost:8080/tokens/" + chainId).then((tokens) => {
      const supportedSourceTokens: SelectSearchOption[] = tokens.data.map(
        ({ chainId, token, name, symbol }) => ({
          name: name + "(" + symbol + ")",
          value: token,
        })
      );
      console.log("Fetched tokens from API");
      setSupportedSourceTokens([
        { name: "Add Your Token", value: ADD_TOKEN_SELECT_KEY },
        ...supportedSourceTokens,
      ]);
    });
  };

  const showAddTokenModal = () => {
    setSelectedSourceTokenDetails(undefined);
    setAddTokenModalShowed(true);
  };

  useEffect(() => {
    setIsFormValid(
      isSet(bridgeFormData) &&
        isSet(bridgeFormData.sourceChain) &&
        isSet(bridgeFormData.targetChain) &&
        isSet(bridgeFormData.sourceToken) &&
        isSet(bridgeFormData.bridgeAmount)
    );
  }, [bridgeFormData, connectedChain, account]);

  useEffect(() => {
    initializeInputData(connectedChain);
  }, [connectedChain, account]);

  return (
    <div className="bridge-setup">
      <div className="bridge-chains-selectors">
        <label htmlFor="sourceChain">Transfer from</label>
        <SelectSearch
          options={supportedSourceChains}
          id="sourceChain"
          disabled={hasBridgingStarted}
          search
          value={bridgeFormData.sourceChain}
          onChange={(selectedValue) =>
            requestNetworkSwitch(selectedValue, connectedChain)
          }
          placeholder="Choose Chain"
        />
      </div>
      <div className="bridge-chains-selectors">
        <label htmlFor="targetChain">Transfer to</label>
        <SelectSearch
          options={supportedTargetChains}
          id="targetChain"
          search
          disabled={hasBridgingStarted}
          value={bridgeFormData.targetChain}
          placeholder="Choose Chain"
          onChange={(targetChain) =>
            setBridgeFormData({
              ...bridgeFormData,
              targetChain: targetChain,
            })
          }
        />
      </div>

      <div className="bridge-tokens-selectors">
        <label htmlFor="sourceToken">You send</label>
        <SelectSearch
          options={supportedSourceTokens}
          id="sourceToken"
          search
          disabled={hasBridgingStarted}
          value={bridgeFormData.sourceToken}
          placeholder="Choose Token"
          onChange={(sourceToken: string) =>
            sourceToken != ADD_TOKEN_SELECT_KEY
              ? handleSourceTokenChanged(sourceToken)
              : showAddTokenModal()
          }
        />
      </div>
      <div className="bridge-amount-selector">
        <div className="bridge-amount-input">
          <label htmlFor="bridge-amount">Enter bridge amount</label>
          <div>
            <NumberFormat
              value={bridgeFormData.bridgeAmountInput}
              typeof={"number"}
              disabled={hasBridgingStarted}
              prefix={selectedSourceTokenDetails?.symbol}
              onValueChange={(values, source) => {
                console.log(values);
                setBridgeFormData({
                  ...bridgeFormData,
                  bridgeAmountInput: values.floatValue,
                  bridgeAmount: values.floatValue
                    ? parseUnits(
                        values.value,
                        selectedSourceTokenDetails?.decimals ?? 18
                      )
                    : initialState.bridgeAmount,
                });
              }}
              allowNegative={false}
              thousandSeparator={true}
              className="some"
              inputMode="numeric"
            />
          </div>
        </div>
        <div className="bridge-token-balance">
          <p>
            Available Balance
            {selectedSourceTokenDetails &&
              availabeSourceTokenAmount &&
              " " +
                selectedSourceTokenDetails.symbol +
                " " +
                parseBalance(
                  availabeSourceTokenAmount,
                  selectedSourceTokenDetails.decimals
                )}
          </p>
        </div>
      </div>
      <button
        disabled={!isFormValid || hasBridgingStarted}
        onClick={() => sendBridgeTransaction()}
      >
        Confirm
      </button>

      <AddTokenComponent
        chainId={bridgeFormData?.sourceChain}
        modalIsOpen={addTokenModalShowed}
        closeModal={() => {
          setBridgeFormData({ ...bridgeFormData, sourceToken: undefined });
          setAddTokenModalShowed(false);
        }}
        onSuccessfullAdd={() =>
          updateSupportedSourceTokens(bridgeFormData?.sourceChain)
        }
      ></AddTokenComponent>
    </div>
  );
};

function isSet(variable: any): boolean {
  if (variable) {
    return true;
  }
  return false;
}

function fromSupportedChain(
  supportedChain: BridgeSupportedChain
): SelectSearchOption {
  return { name: supportedChain.chainName, value: supportedChain.chainId };
}

export default Bridge;
