import listenForTokenConnections from "./token-connection-listener";
import listenForBurnEvents from "./validator-listener-burn";
import listenForLockEvents from "./validator-listener-lock";

async function runValidator() {
  await listenForLockEvents();
  await listenForBurnEvents();
  await listenForTokenConnections();
}

export default runValidator;
