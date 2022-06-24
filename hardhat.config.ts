import 'dotenv/config';
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import '@nomiclabs/hardhat-waffle';
import "@nomiclabs/hardhat-etherscan";
import 'solidity-coverage';

/**
 * Deployments Tasks
 */
task("setup-dev", "Setup development environment")
  .setAction(async (args, hre) => {
    await hre.run('compile');
    const setup = require("./scripts/deployments/localhost/setup");
    return await setup();
 });

task("deploy-token", "Deploys token on localhost")
  .addParam("name", "The token name")
  .addParam("symbol", "The token symbol")
  .addOptionalParam("bridgeAddress", "The bridge to be granted minter role")
  .setAction(async ({name, symbol}) => {
    const deployToken = require("./scripts/deployments/localhost/deploy-token");
    return await deployToken(name, symbol);
});

task("setup-testnet", "Setup testnet environment")
  .addParam("verifyContract", "Enables verification of the contract on Etherscan")
  .setAction(async ({verifyContract}, hre) => {
    await hre.run('compile');
    const setup = require("./scripts/deployments/testnets/setup.ts");
    return await setup(verifyContract);
 });

export default {
  solidity: "0.8.4",
  networks: {
    ganache: {
      url: process.env.GANACHE_URL,
      chainId: 1337
    },
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    },
    ropsten: {
      url: process.env.ROPSTEN_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  },  
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
