import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import useFeeCalculatorContract from "../hooks/useFeeCalculatorContract";
import { parseBalance } from "../util";

const ServiceFee = async () => {
  const { account } = useWeb3React<Web3Provider>();
  const { serviceFee } = useFeeCalculatorContract(account);
   
  return <p>The bridging service fee is: Ξ{parseBalance(await serviceFee() ?? 0)}</p>;
};

export default ServiceFee;
