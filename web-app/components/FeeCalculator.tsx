import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { BigNumberish } from "ethers";
import { useEffect, useState } from "react";
import useFeeCalculatorContract from "../hooks/useFeeCalculatorContract";
import { parseBalance } from "../util";

const FeeCalculator = () => {
  const { chainId } = useWeb3React<Web3Provider>();
  const feeCalculatorContract = useFeeCalculatorContract();
  const [serviceFee, setServiceFee] = useState<BigNumberish>(0);

  useEffect(() => {
    getServiceFee();
  }, [chainId]);

  const getServiceFee = async () => {
    const newServiceFee: BigNumberish =
      await feeCalculatorContract.serviceFee();
    console.log(
      "Setting new service fee %d for chain %d",
      newServiceFee,
      chainId
    );
    setServiceFee(newServiceFee);
  };

  return <p>The bridging service fee is: Ξ{parseBalance(serviceFee)}</p>;
};

export default FeeCalculator;
