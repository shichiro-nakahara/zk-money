import type { DefiRecipe } from '../../alt-model/defi/types.js';
import { useMemo } from 'react';
import { TokenList } from './token_list.js';
import { useBalances } from '../../alt-model/index.js';
import { useHiddenAssets } from '../../alt-model/defi/hidden_asset_hooks.js';
import { RemoteAsset } from '../../alt-model/types.js';
import style from './holdings_list.module.scss';

interface HoldingsListProps {
  onOpenDefiExitModal: (recipe: DefiRecipe) => void;
  onOpenShieldModal: (asset: RemoteAsset, amount?: string) => void;
  onOpenSendModal: (assetId: number) => void;
}

export function HoldingsList(props: HoldingsListProps) {
  const allBalances = useBalances();
  const hiddenAssets = useHiddenAssets();
  const shownBalances = useMemo(
    () => allBalances?.filter(assetValue => !hiddenAssets.some(hiddenAsset => hiddenAsset.id === assetValue.assetId)),
    [allBalances, hiddenAssets],
  );

  return (
    <div className={style.holdingsListWrapper}>
      <TokenList
        balances={shownBalances}
        onOpenShieldModal={props.onOpenShieldModal}
        onOpenSendModal={props.onOpenSendModal}
      />
    </div>
  );
}
