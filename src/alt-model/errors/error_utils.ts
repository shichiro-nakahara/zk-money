import { AztecSdk } from '@polyaztec/sdk';

export function formatError(error: unknown, messageOnly = false): string | undefined {
  if (error instanceof Error) {
    if (messageOnly) return error.message?.toString?.();
    return error.stack?.toString?.() || error.message?.toString?.();
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as any).message?.toString?.();
  }
  if (typeof error === 'string') {
    return error;
  }
  return (error as any)?.toString?.();
}
const SNIPPETS_THAT_SHOULDNT_BE_SHOWN_TOP_LEVEL = [
  // TODO: This `isBatchingLegacy` exception can be removed once wagmi
  // and rainbowkit have been upgraded.
  "Cannot read properties of undefined (reading 'isBatchingLegacy')",
  'MetaMask Message Signature: User denied message signature.',
  'MetaMask Tx Signature: User denied transaction signature.',
  'Exceeded daily deposit limit',
];

export function shouldErrorBeShownAtTopLevel(error: unknown) {
  const formattedError = formatError(error);
  if (SNIPPETS_THAT_SHOULDNT_BE_SHOWN_TOP_LEVEL.some(snippet => formattedError?.includes(snippet))) {
    return false;
  }
  return true;
}

const SNIPPETS_THAT_SHOULDNT_BE_REPORTED = SNIPPETS_THAT_SHOULDNT_BE_SHOWN_TOP_LEVEL.concat([
  'Failed to contact rollup provider.',
]);

export function shouldAllowErrorToBeReported(error: unknown) {
  const formattedError = formatError(error);
  if (SNIPPETS_THAT_SHOULDNT_BE_REPORTED.some(snippet => formattedError?.includes(snippet))) {
    return false;
  }
  return true;
}

const CONFIRMATION_MESSAGE =
  'The following information will be sent to Aztec to help with improving the product:\n' +
  '  - The web browser version\n' +
  '  - The amount of memory and CPU cores available to the web browser\n' +
  '  - The name of your Ethereum wallet provider\n' +
  '  - The call stack of the error that occurred\n' +
  '  - Any logs produced by the Aztec SDK since the page loaded';

export function confirmAndSendErrorReport(sdk: AztecSdk, errorDetail: string) {
  alert('This feature has not been implemented on PolyAztec (yet). Please reach out via our social channels for help.');
  return false;
  // const confirmed = window.confirm(CONFIRMATION_MESSAGE);
  // if (!confirmed) return false;
  // fetch('https://api.telegram.org/bot6251864684:AAGtdv0n8vWj-knNBqGveeMmmQRjdGzQguU/sendMessage', {
  //   method: 'POST',
  //   headers: {
  //     'Accept': 'application/json',
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     'chat_id': '-860602177', 
  //     'text': errorDetail
  //   })
  // })
  return true;
}
