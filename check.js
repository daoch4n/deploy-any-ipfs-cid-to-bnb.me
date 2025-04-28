import axios from 'axios';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

async function main() {
  console.log('Checking domain resolution for daoko.bnb...');

  const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  console.log('Connected to BNB Mainnet');

  const BNS_REGISTRY_ADDRESS = '0x08CEd32a7f3eeC915Ba84415e9C07a7286977956',
    BNS_REGISTRY_ABI = [
      'function owner(bytes32 node) external view returns (address)',
      'function resolver(bytes32 node) external view returns (address)',
    ],
    bnsRegistry = new ethers.Contract(BNS_REGISTRY_ADDRESS, BNS_REGISTRY_ABI, provider),
    daokoNode = ethers.utils.namehash('daoko.bnb');
  console.log(`Namehash for daoko.bnb: ${daokoNode}`);

  try {
    const domainOwner = await bnsRegistry.owner(daokoNode);
    console.log(`Domain owner: ${domainOwner}`);

    const resolverAddress = await bnsRegistry.resolver(daokoNode);
    console.log(`Domain resolver: ${resolverAddress}`);

    if (
      resolverAddress.toLowerCase() === '0xD7921CA7b35F9378bF8630ee429C6c10B0b26829'.toLowerCase()
    ) {
      console.log(`✅ Domain resolver is correctly set to the IPNS contract!`);

      const contractABI = [
          'function ipnsRecord() view returns (string)',
          'function domain() view returns (string)',
        ],
        contract = new ethers.Contract(resolverAddress, contractABI, provider),
        ipnsRecord = await contract.ipnsRecord(),
        domain = await contract.domain();

      console.log(`\nContract information:`);
      console.log(`Domain: ${domain}`);
      console.log(`IPNS Record: ${ipnsRecord}`);

      console.log(`\nAttempting to resolve IPNS content through gateway...`);
      try {
        const gatewayUrl = `https://ipfs.io/ipns/${ipnsRecord}`;
        console.log(`Gateway URL: ${gatewayUrl}`);

        const response = await axios.get(gatewayUrl, { timeout: 10_000 });
        console.log(`✅ Successfully resolved IPNS content!`);
        console.log(`Status: ${response.status}`);
        console.log(`Content type: ${response.headers['content-type']}`);
        console.log(`Content length: ${response.data.length} bytes`);
      } catch (error) {
        console.log(`❌ Error resolving IPNS content: ${error.message}`);
        console.log(`This is normal if the IPNS record doesn't point to published content yet.`);
      }

      try {
        console.log(`\nAttempting to resolve IPNS content through dweb.link gateway...`);
        const dwebGatewayUrl = `https://${ipnsRecord}.ipns.dweb.link/`;
        console.log(`Gateway URL: ${dwebGatewayUrl}`);

        const response = await axios.get(dwebGatewayUrl, { timeout: 10_000 });
        console.log(`✅ Successfully resolved IPNS content through dweb.link!`);
        console.log(`Status: ${response.status}`);
        console.log(`Content type: ${response.headers['content-type']}`);
        console.log(`Content length: ${response.data.length} bytes`);
      } catch (error) {
        console.log(`❌ Error resolving IPNS content through dweb.link: ${error.message}`);
      }
    } else {
      console.log(`❌ Domain resolver is not set to the IPNS contract!`);
    }
  } catch (error) {
    console.error(`Error checking domain resolution:`, error.message);
  }
}

main()
  .then(() => {
    console.log(`\nDomain resolution check completed`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
