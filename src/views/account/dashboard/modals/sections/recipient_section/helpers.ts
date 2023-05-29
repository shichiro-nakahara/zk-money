import { GrumpkinAddress } from '@polyaztec/sdk';

const GRUMPKIN_PREFIX_LENGTH = 'polyaztec:'.length;
const GRUMPKIN_ADDRESS_LENGTH = 130;

export const removePrefixFromRecipient = (recipient: string) => {
  // removes grumpkin prefix
  if (
    recipient.length === GRUMPKIN_PREFIX_LENGTH + GRUMPKIN_ADDRESS_LENGTH &&
    GrumpkinAddress.isAddress(recipient.substring(GRUMPKIN_PREFIX_LENGTH))
  ) {
    return recipient.substring(GRUMPKIN_PREFIX_LENGTH);
  }

  return recipient;
};

export const getPrefixFromRecipient = (recipientType: string, recipientStr: string) => {
  if (recipientType === 'L2') {
    return GrumpkinAddress.isAddress(recipientStr) ? 'polyaztec:' : '@';
  }
};
