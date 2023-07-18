import { useEffect, useState } from 'react';
import { GrumpkinAddress, AssetValue } from '@polyaztec/sdk';
import { isValidAliasInput } from '../app/index.js';
import { createGatedSetter, useObs } from '../app/util/index.js';
import { useAccountState } from './account_state/index.js';
import { useSdk, useAliasManager } from './top_level_context/index.js';

export function useUserIdForRecipientStr(recipientStr: string, debounceMs: number, allowOwnAlias?: boolean) {
  const accountState = useAccountState();
  const sdk = useSdk();
  const cachedAlias = useCachedAlias();
  const [userIdFetchState, setUserIdFetchState] = useState<{
    userId?: GrumpkinAddress;
    isLoading: boolean;
  }>({
    isLoading: false,
  });
  const isGrumpkinAddress = GrumpkinAddress.isAddress(recipientStr);
  useEffect(() => {
    if (!isValidAliasInput(recipientStr) && !isGrumpkinAddress) {
      setUserIdFetchState({ isLoading: false });
      return;
    }
    const gatedSetter = createGatedSetter(setUserIdFetchState);
    gatedSetter.set({ isLoading: true });

    const task = setTimeout(() => {
      if (isGrumpkinAddress) {
        gatedSetter.set({ isLoading: false, userId: GrumpkinAddress.fromString(recipientStr) });
      } else if (allowOwnAlias && recipientStr === cachedAlias) {
        gatedSetter.set({ isLoading: false, userId: accountState?.userId });
      } else {
        sdk?.getAccountPublicKey(recipientStr).then(userId => {
          const isErrorState = accountState?.userId && userId?.equals(accountState?.userId) && !allowOwnAlias;
          gatedSetter.set({ isLoading: false, userId: isErrorState ? undefined : userId });
        });
      }
    }, debounceMs);
    return () => {
      gatedSetter.close();
      clearTimeout(task);
    };
  }, [sdk, isGrumpkinAddress, accountState?.userId, cachedAlias, allowOwnAlias, debounceMs, recipientStr]);
  return userIdFetchState;
}

export function useUserIdForRegistrationStr(alias: string, assetId: number, debounceMs: number) {
  const sdk = useSdk();
  const [registrationFetchState, setRegistrationFetchState] = useState<{
    isRegistered?: boolean;
    aliasFee: AssetValue | null;
    isLoading: boolean;
  }>({
    isLoading: false,
    aliasFee: null
  });

  useEffect(() => {
    if (!isValidAliasInput(alias)) {
      setRegistrationFetchState({ isLoading: false });
      return;
    }

    const gatedSetter = createGatedSetter(setRegistrationFetchState);
    gatedSetter.set({ isLoading: true });

    const task = setTimeout(async () => {
      const registered = await sdk?.isAliasRegistered(alias, true);
      const aliasFee = await sdk?.getAliasFee(alias, assetId);
      setRegistrationFetchState({ isRegistered: registered, aliasFee: aliasFee, isLoading: false });
    }, debounceMs);

    return () => {
      gatedSetter.close();
      clearTimeout(task);
    };
  }, [sdk, alias, debounceMs, assetId]);

  return registrationFetchState;
}

export function useCachedAlias(): string | undefined {
  const accountState = useAccountState();
  const aliasManager = useAliasManager();
  const aliasByUserId = useObs(aliasManager.aliasByUserIdStringObs);
  if (!accountState) return;
  return aliasByUserId[accountState.userId.toString()];
}