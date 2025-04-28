import axios from 'axios';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

async function main() {
  console.log('Starting direct IPNS record verification...');

  if (!process.env.CONTRACT_ADDRESS) {
    console.error(
      'Error: CONTRACT_ADDRESS not found. Please set it in the .env file or as an environment variable',
    );
    process.exit(1);
  }

  const contractAddress = process.env.CONTRACT_ADDRESS,
    provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  console.log(`Connected to BNB Mainnet`);

  const abi = [
      'function ipnsRecord() view returns (string)',
      'function domain() view returns (string)',
    ],
    contract = new ethers.Contract(contractAddress, abi, provider),
    ipnsRecord = await contract.ipnsRecord(),
    domain = await contract.domain();

  console.log(`Contract address: ${contractAddress}`);
  console.log(`Domain: ${domain}`);
  console.log(`IPNS record from contract: ${ipnsRecord}`);

  try {
    console.log(`\nAttempting to resolve IPNS content through gateway...`);
    const gatewayUrl = `https://ipfs.io/ipns/${ipnsRecord}`;
    console.log(`Gateway URL: ${gatewayUrl}`);

    const response = await axios.get(gatewayUrl, { timeout: 10_000 });
    console.log(`✅ Successfully resolved IPNS content!`);
    console.log(`Status: ${response.status}`);
    console.log(`Content type: ${response.headers['content-type']}`);
    console.log(`Content length: ${response.data.length} bytes`);

    if (response.headers['content-type'].includes('text/html')) {
      const preview = `${response.data.slice(0, 200)}...`;
      console.log(`\nContent preview:\n${preview}`);
    }
  } catch (error) {
    console.error(`❌ Error resolving IPNS content:`, error.message);
  }

  try {
    console.log(`\nAttempting to resolve IPNS content through dweb.link gateway...`);
    const dwebGatewayUrl = `https://${ipnsRecord}.ipns.dweb.link/`;
    console.log(`Gateway URL: ${dwebGatewayUrl}`);

    const response = await axios.get(dwebGatewayUrl, { timeout: 10_000 });
    console.log(`✅ Successfully resolved IPNS content!`);
    console.log(`Status: ${response.status}`);
    console.log(`Content type: ${response.headers['content-type']}`);
    console.log(`Content length: ${response.data.length} bytes`);
  } catch (error) {
    console.error(`❌ Error resolving IPNS content through dweb.link:`, error.message);
  }

  return ipnsRecord;
}

main()
  .then(ipnsRecord => {
    console.log(`\nVerification completed for IPNS record: ${ipnsRecord}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
