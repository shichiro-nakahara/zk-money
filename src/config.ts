import { SDK_VERSION, getRollupProviderStatus } from '@aztec/sdk';
import { AssetLabel } from './alt-model/known_assets/known_asset_display_data.js';
import { toBaseUnits } from './app/units.js';

export const configuration = {
  ethereumHost: 'https://polygon-mumbai.infura.io/v3/c42752f74b094eae8cfaa0e193d33801',
  explorerUrl: 'https://block-explorer.dev.polyaztec.xyz',
  hostedSdkUrl: null,
  rollupHost: 'https://falafel.dev.polyaztec.xyz',
};

export interface Config {
  deployTag: string;
  hostedSdkUrl: string;
  rollupProviderUrl: string;
  explorerUrl: string;
  chainId: number;
  ethereumHost: string;
  txAmountLimits: Record<AssetLabel, bigint>;
  debugFilter: string;
}

interface ConfigVars {
  deployTag: string;
  debugFilter: string;
}

const removeEmptyValues = (vars: ConfigVars): Partial<ConfigVars> => {
  const nonEmptyVars = { ...vars };
  (Object.keys(vars) as (keyof ConfigVars)[]).forEach(key => {
    if (!vars[key]) {
      delete nonEmptyVars[key];
    }
  });
  return nonEmptyVars;
};

const fromLocalStorage = (): ConfigVars => ({
  deployTag: localStorage.getItem('zm_deployTag') || '',
  debugFilter: localStorage.getItem('zm_debug') ?? '',
});

const fromEnvVars = (): ConfigVars => {
  return {
    deployTag: import.meta.env.REACT_APP_DEPLOY_TAG || '',
    debugFilter: import.meta.env.REACT_APP_DEBUG ?? '',
  };
};

const productionConfig: ConfigVars = {
  deployTag: '',
  debugFilter: 'zm:*,bb:*',
};

const developmentConfig: ConfigVars = {
  ...productionConfig,
  debugFilter: 'zm:*,bb:*',
};

async function getInferredDeployTag() {
  // If we haven't overridden our deploy tag, we discover it at runtime. All s3 deployments have a file
  // called DEPLOY_TAG in their root containing the deploy tag.
  if (process.env.NODE_ENV !== 'development') {
    const resp = await fetch('/DEPLOY_TAG');
    const text = await resp.text();
    return text.replace('\n', '');
  } else {
    // Webpack's dev-server would serve up index.html instead of the DEPLOY_TAG.
    return 'aztec-connect-prod';
  }
}

function getDeployConfig(deployTag: string, rollupProviderUrl: string, chainId: number) {
  return {
    deployTag,
    hostedSdkUrl: configuration.hostedSdkUrl,
    rollupProviderUrl,
    explorerUrl: configuration.explorerUrl,
    chainId,
    ethereumHost: configuration.ethereumHost,
  };
}

function getRawConfigWithOverrides() {
  const defaultConfig = process.env.NODE_ENV === 'development' ? developmentConfig : productionConfig;
  return { ...defaultConfig, ...removeEmptyValues(fromEnvVars()), ...removeEmptyValues(fromLocalStorage()) };
}

function assembleConfig(
  rawConfig: ReturnType<typeof getRawConfigWithOverrides>,
  deployConfig: ReturnType<typeof getDeployConfig>,
): Config {
  const { debugFilter } = rawConfig;

  return {
    ...deployConfig,
    txAmountLimits: {
      Eth: toBaseUnits('5', 18),
      WETH: 0n, // unused
      DAI: toBaseUnits('10000', 18),
      wstETH: toBaseUnits('6', 18),
      stETH: 0n, // unused
      yvWETH: toBaseUnits('5', 18),
      yvDAI: toBaseUnits('10000', 18),
      weWETH: toBaseUnits('5', 18),
      wewstETH: toBaseUnits('6', 18),
      weDAI: toBaseUnits('10000', 18),
      wa2WETH: toBaseUnits('5', 18),
      wa2DAI: toBaseUnits('12000', 18),
      LUSD: toBaseUnits('10000', 18),
      'TB-275': toBaseUnits('10000', 18),
      'TB-400': toBaseUnits('10000', 18),
      wcDAI: toBaseUnits('10000', 18),
      icETH: toBaseUnits('5', 18),
      yvLUSD: toBaseUnits('10000', 18),
    },
    debugFilter,
  };
}

export async function getEnvironment() {
  const rawConfig = getRawConfigWithOverrides();
  const deployTag = rawConfig.deployTag || (await getInferredDeployTag());
  const initialRollupProviderStatus = await getRollupProviderStatus(configuration.rollupHost);
  const deployConfig = getDeployConfig(
    deployTag,
    configuration.rollupHost,
    initialRollupProviderStatus.blockchainStatus.chainId,
  );
  const config = assembleConfig(rawConfig, deployConfig);
  return {
    config,
    initialRollupProviderStatus,
    staleFrontend: initialRollupProviderStatus.version !== SDK_VERSION,
  };
}
