import listenForTokenConnections from "./token-connection-listener";
import listenForBurnEvents from "./validator-listener-burn";
import listenForLockEvents from "./validator-listener-lock";
import listenForMintEvents from "./validator-listener-mint";
import listenForReleaseEvents from "./validator-listener-release";

async function runValidator() {
  await listenForLockEvents();
  await listenForMintEvents();

  await listenForBurnEvents();
  await listenForReleaseEvents();
  await listenForTokenConnections();
}

export default runValidator;
