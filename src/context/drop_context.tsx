import { createContext, useContext, ReactElement, useState, useEffect } from 'react';
import { useAccountStateManager } from '../alt-model/top_level_context/top_level_context_hooks.js';
import { useObs } from '../app/util/index.js';
import { configuration } from '../config.js';
import { ethers } from 'ethers';
import * as drop from '../app/drop.js';

type DropContextType = {
  drops: any[];
  claims: any[];
  updateClaims: Function;
};

const DropContext = createContext<DropContextType>(undefined as any);

export const DropContextProvider = ({ children }: { children: ReactElement }) => {
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);
  const address = accountState ? accountState.ethAddressUsedForAccountKey.toString() : '';

  const [claims, setClaims] = useState<undefined | any[]>(undefined);
  const [drops, setDrops] = useState<undefined | any[]>(undefined);

  useEffect(() => {
    async function run() {
      const result = await fetch(`${configuration.tokenDropUrl}/drop`);
      if (result.status != 200) throw new Error(`Could not get drop data from server!`);
      const drops = (await result.json()).data;
      setDrops(drops);
    }
    run();

  }, []);

  useEffect(() => {
    updateClaims();

  }, [address, drops]);

  async function updateClaims() {
    if (!address || !drops) return;

    const result = await fetch(`${configuration.tokenShopUrl}/drop?address=${address}`);
    if (result.status != 200) throw new Error('Could not get claim history from server!');

    const claims = (await result.json()).data.map((c) => {
      const config = drops.find((d) => d.uid == c.drop?.tokenDropUid);
      c.id = config ? config.id : null;
      return c; 
    });

    const provider = new ethers.providers.JsonRpcProvider(configuration.ethereumHost);
    const contract = (await drop.getContract()).connect(provider);

    const hasClaimed = await Promise.all(
      claims.map((c) => {
        if (c.id === null) return false;
        try {
          return contract.hasClaimed(c.id, address);
        }
        catch (e) {
          console.error(e);
          return false;
        }
      })
    );

    setClaims(
      claims.map((c, i) => {
        c.hasClaimed = hasClaimed[i];
        return c;
      })
    );
  }

  return (
    <DropContext.Provider value={{ drops, claims, updateClaims }}>
      { children }
    </DropContext.Provider>
  );
};

export const useDropContext = () => useContext(DropContext);