import listenForLockEvents from "./validator-listener-lock";

async function runValidator() {
  await listenForLockEvents();
}

export default runValidator;
