import MerkleTree from 'merkletreejs';
import * as ethers from 'ethers';
import { configuration } from '../config.js';

const trees = {};
let dropContract: ethers.Contract | undefined = undefined;

interface Recipient {
  address: string;
  wei: string;
}

function generateLeaf(recipient: Recipient): Buffer {
  return Buffer.from(
    ethers.utils.solidityKeccak256(['address', 'uint256'], [recipient.address, recipient.wei]).slice(2),
    'hex',
  );
}

export async function getContract(): Promise<ethers.Contract> {
  if (!dropContract) {
    const result = await fetch(`${configuration.tokenDropUrl}/config`);
    const config = (await result.json()).data;
    if (!config) throw new Error(`Could not get token drop config from server`);
    dropContract = new ethers.Contract(config.drop.contract.address, config.drop.contract.abi);
  }
  return dropContract;
}

export async function getTree(uid: string) {
  if (!trees[uid]) {
    const result = await fetch(`${configuration.tokenDropUrl}/drop/${uid}/tree`);
    const json = await result.json();
    if (json.status != 200 || json.error) {
      return null;
    }
    trees[uid] = json.data;
    return trees[uid];
  }

  return trees[uid];
}

export async function claim(signer: ethers.Signer, address: string, id: number, uid: string) {
  const tree = await getTree(uid);
  const amount = tree.recipients[address];
  if (!amount) {
    throw new Error(`${address} is not eligible for drop ${uid}`);
  }

  const recipients = Object.keys(tree.recipients).map(recipient => {
    return {
      address: recipient,
      wei: tree.recipients[recipient],
    };
  });

  if (recipients.length % 2 != 0) {
    recipients.push({
      address: '0x000000000000000000000000000000000000dEaD',
      wei: '0',
    });
  }

  const merkleTree = new MerkleTree(
    recipients.map(recipient => generateLeaf(recipient)),
    ethers.utils.keccak256,
    { sort: true },
  );

  const claimLeaf = generateLeaf({ address, wei: amount });
  const proof = merkleTree.getHexProof(claimLeaf);

  const contract = (await getContract()).connect(signer);
  return await contract.claim(id, address, amount, proof, { gasLimit: '250000' });
}
