import { KNOWN_MAINNET_ASSET_ADDRESS_STRS as KMAAS } from '../known_assets/known_asset_addresses.js';

export const CHAIN_LINK_ORACLE_ADDRESSES = {
  DAI_ETH: '0x0000000000000000000000000000000000000000', // Not used... probably
  ETH_USD: '0xab594600376ec9fd91f8e885dadf0ce036862de0',
  DAI_USD: '0x4746dec9e833a82ec7c2c1356372ccf2cfcd2f3d',
  stETH_USD: '0x0000000000000000000000000000000000000000', // Not used
  LUSD_USD: '0x0000000000000000000000000000000000000000', // Not used
};

const CLOA = CHAIN_LINK_ORACLE_ADDRESSES;

export function getUsdOracleAddressForAsset(assetAddressStr: string) {
  switch (assetAddressStr) {
    case KMAAS.Eth:
    case KMAAS.WETH:
      return CLOA.ETH_USD;
    case KMAAS.DAI:
      return CLOA.DAI_USD;
    case KMAAS.stETH:
      return CLOA.stETH_USD;
    case KMAAS.LUSD:
      return CLOA.LUSD_USD;
  }
}
