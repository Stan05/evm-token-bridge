import 'dotenv/config';
import { task, subtask } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import '@nomiclabs/hardhat-waffle';
import 'solidity-coverage';

/**
 * Deployments Tasks
 */
task("deploy-localhost", "Deploys the bridge on localhost")
  .setAction(async (args, hre) => {
    await hre.run('compile');
    const deployBridge = require("./scripts/deployments/deploy-bridge");
    return await deployBridge();
 });

task("deploy-token", "Deploys token on localhost")
  .addParam("name", "The token name")
  .addParam("symbol", "The token symbol")
  .addOptionalParam("bridgeAddress", "The bridge to be granted minter role")
  .setAction(async ({name, symbol}) => {
     const deployToken = require("./scripts/deployments/deploy-token");
    return await deployToken(name, symbol);
});

/**
 * Interactions Tasks
 */
task("bridge-localhost", "Interact with bridge on localhost")
  .addParam("tokenContract", "The token conrtact address")
  .addParam("bridgeContract", "The bridge conrtact address")
  .setAction(async (args, hre, runSuper) => {
    const bridge = require("./scripts/interactions/bridge");
    await bridge(args.tokenContract, args.bridgeContract);
  });

export default {
  solidity: "0.8.4",
  networks: {
    ganache: {
      url: process.env.GANACHE_URL,
      chainId: 1337
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
