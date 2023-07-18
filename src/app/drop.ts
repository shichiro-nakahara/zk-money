import MerkleTree from 'merkletreejs';
import * as ethers from 'ethers';
import { configuration } from '../config.js';
import { getWagmiRainbowConfig } from '../toolbox/wagmi_rainbow_config.js';
import { getEnvironment } from '../config.js';

const trees = {};
let cfg = null;
let prov = null;

interface Recipient {
  address: string;
  wei: string;
}

function generateLeaf(recipient: Recipient): Buffer {
  return Buffer.from(
    ethers.utils.solidityKeccak256(['address', 'uint256'], [recipient.address, recipient.wei]).slice(2),
    'hex'
  );
}

async function getProvider() {
  if (!prov) {
    const { config } = await getEnvironment();
    const { wagmiClient } = getWagmiRainbowConfig(config);
    console.log(wagmiClient);
    prov = wagmiClient.provider;
  }
  return prov;
}

async function getConfig(): Promise<any> {
  if (!cfg) {
    const result = await fetch(`${configuration.tokenDropUrl}/config`);
    const configFromServer = (await result.json()).data;
    cfg = configFromServer;
  }
  return cfg;
}

export async function getTree(uid: string) {
  if (!trees[uid]) {
    const result = await fetch(`${configuration.tokenDropUrl}/drop/${uid}/tree`);
    const tree = (await result.json()).data;
    trees[uid] = tree;
    return tree;
  }

  return trees[uid];
}

export async function claim(address: string, uid: string) {
  const tree = await getTree(uid);
  const amount = tree.recipients[address];
  if (!amount) {
    console.error(`${address} not eligible for drop ${uid}`);
    return;
  }

  const recipients = Object.keys(tree.recipients).map((recipient) => {
    return {
      address: recipient, 
      wei: tree.recipients[recipient]
    };
  });

  if (recipients.length % 2 != 0) {
    recipients.push({
      address: '0x000000000000000000000000000000000000dEaD',
      wei: '0'
    });
  }

  const merkleTree = new MerkleTree(
    recipients.map((recipient) => generateLeaf(recipient)),
    ethers.utils.keccak256,
    { sort: true }
  );

  const claimLeaf = generateLeaf({address, wei: amount});
  const proof = merkleTree.getHexProof(claimLeaf);
  const config = await getConfig();
  if (!config) {
    console.error(`Could not get config from server`);
    return;
  }
  const provider = await getProvider();
  const dropContract = new ethers.Contract(config.drop.contract.address, config.drop.contract.abi, provider);
  try {
    console.log(`Sending claim ${address} for amount ${amount}`);
    // const tx = await dropContract.claim(address, amount, proof);
    // console.log(tx);
  }
  catch (e) {

  }
}
