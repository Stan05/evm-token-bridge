import listenForBurnEvents from "./validator-listener-burn";
import listenForLockEvents from "./validator-listener-lock";

async function runValidator() {
  await listenForLockEvents();
  await listenForBurnEvents();
}

export default runValidator;
