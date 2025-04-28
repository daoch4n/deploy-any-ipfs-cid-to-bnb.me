import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

const __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename);

async function main() {
  console.log('Starting IPFS CID update for BNB domain...');

  if (!process.env.PRIVATE_KEY) {
    console.error('Error: PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  if (!process.env.NEW_CID) {
    console.error(
      'Error: NEW_CID not found. Please set it in the .env file or as an environment variable',
    );
    process.exit(1);
  }

  const domainName = process.env.DOMAIN || 'daoko.bnb';
  console.log(`Using domain: ${domainName}`);

  const newCID = process.env.NEW_CID;
  console.log(`New IPFS CID: ${newCID}`);

  if (!newCID.startsWith('Qm')) {
    console.warn(`Warning: The CID doesn't start with 'Qm'. BNB.me works best with CIDv0 format.`);
    console.warn(`If you have a CIDv1 hash (starting with 'baf'), convert it using:`);
    console.warn(`ipfs cid format -v 0 -b base58btc your_cid`);

    console.log(`\nDo you want to continue anyway? (y/n)`);
    console.log(`Proceeding in 5 seconds (assuming yes)...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/'),
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Connected to BNB Mainnet with address: ${wallet.address}`);

  const balance = await wallet.getBalance();
  console.log(`Wallet balance: ${ethers.utils.formatEther(balance)} BNB`);

  if (balance.lt(ethers.utils.parseEther('0.01'))) {
    console.warn('Warning: Low balance. You may need more BNB for the transaction.');
  }

  const BNS_REGISTRY_ADDRESS = '0x08CEd32a7f3eeC915Ba84415e9C07a7286977956',
    BNS_REGISTRY_ABI = [
      'function owner(bytes32 node) external view returns (address)',
      'function resolver(bytes32 node) external view returns (address)',
    ],
    bnsRegistry = new ethers.Contract(BNS_REGISTRY_ADDRESS, BNS_REGISTRY_ABI, provider),
    domainNode = ethers.utils.namehash(domainName);
  console.log(`Namehash for ${domainName}: ${domainNode}`);

  try {
    const domainOwner = await bnsRegistry.owner(domainNode);
    console.log(`Domain owner: ${domainOwner}`);

    if (domainOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.warn(
        `Warning: You (${wallet.address}) are not the owner of ${domainName} (${domainOwner})`,
      );
      console.warn(`You may not have permission to update the resolver's contenthash.`);
      console.log(`\nDo you want to continue anyway? (y/n)`);
      console.log(`Proceeding in 5 seconds (assuming yes)...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const resolverAddress = await bnsRegistry.resolver(domainNode);
    console.log(`Domain resolver: ${resolverAddress}`);

    if (resolverAddress === ethers.constants.AddressZero) {
      console.error(`Error: No resolver set for ${domainName}`);
      process.exit(1);
    }

    const resolverABI = [
        'function contenthash(bytes32 node) view returns (bytes)',
        'function setContenthash(bytes32 node, bytes calldata hash) external',
      ],
      resolver = new ethers.Contract(resolverAddress, resolverABI, wallet),
      currentContenthash = await resolver.contenthash(domainNode);
    console.log(`Current contenthash: ${currentContenthash}`);

    if (currentContenthash && currentContenthash.length > 2) {
      try {
        const hex = currentContenthash.startsWith('0x')
          ? currentContenthash.slice(2)
          : currentContenthash;
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(Number.parseInt(hex.substr(i, 2), 16));
        }
        console.log(`Current contenthash decoded: ${str}`);
      } catch (error) {
        console.log(`Could not decode current contenthash: ${error.message}`);
      }
    }

    let newHex = '';
    for (let i = 0; i < newCID.length; i++) {
      const charCode = newCID.charCodeAt(i);
      newHex += charCode.toString(16).padStart(2, '0');
    }
    const newContenthash = `0x${newHex}`;
    console.log(`New contenthash: ${newContenthash}`);

    console.log(`\nUpdating contenthash for ${domainName}...`);
    try {
      const tx = await resolver.setContenthash(domainNode, newContenthash, {
        gasLimit: 100_000,
        gasPrice: ethers.utils.parseUnits('3', 'gwei'),
      });

      console.log(`Transaction hash: ${tx.hash}`);
      console.log('Waiting for transaction to be mined...');

      await tx.wait();
      console.log('Transaction confirmed');

      const updatedContenthash = await resolver.contenthash(domainNode);
      console.log(`Updated contenthash: ${updatedContenthash}`);

      if (updatedContenthash === newContenthash) {
        console.log(`\n✅ Contenthash updated successfully for ${domainName}`);
        console.log(`The domain now points to IPFS CID: ${newCID}`);
      } else {
        console.error(`\n❌ Contenthash update failed`);
        process.exit(1);
      }

      const updateInfo = {
        domain: domainName,
        network: 'bnbMainnet',
        newCID,
        newContenthash,
        oldContenthash: currentContenthash,
        resolverAddress,
        timestamp: new Date().toISOString(),
        transactionHash: tx.hash,
        updater: wallet.address,
      };

      fs.writeFileSync(
        path.join(__dirname, 'update-info.json'),
        JSON.stringify(updateInfo, null, 2),
      );

      console.log('Update information saved to update-info.json');

      return tx.hash;
    } catch (error) {
      console.error('Error during update:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error checking domain:`, error.message);
    process.exit(1);
  }
}

main()
  .then(txHash => {
    console.log(`\nUpdate completed. Transaction hash: ${txHash}`);
    console.log(`\nYou can now access your content at:`);
    console.log(`- https://${process.env.DOMAIN || 'daoko.bnb'}.me/`);
    console.log(`- https://ipfs.io/ipfs/${process.env.NEW_CID}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
