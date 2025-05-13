# [daoko.bnb](https://daoko.bnb.me) Deployment Tools
So, you got yourself sweet new .bnb domain, but what to do with it except using it as fancy name of your wallet? Host some DApp there! While [BNB.me](https://bnb.me) natively allows you to deploy simple template sites , with this repo you can go further and host any static website (or DApp) there!
## This repo contains tools for deploying [DaokoTube](https://github.com/dtub/DaokoTube) (or anything else you desire) to your [BNB domain](https://space.id).

The `update.js` script allows you to deploy a specific IPFS hash to your BNB domain obtained vis [SpaceID](https://www.space.id/).

### Prerequisites

1. Node.js (v14+) installed
2. A BNB Chain wallet with BNB for gas fees
3. A registered .bnb domain through [Space.ID](https://space.id)
4. Deployed any standart template on [BNB.me](https://bnb.me)

### Setting Up Your BNB Domain

Before you can deploy content to your BNB domain, you need to register and set up your domain. This is a one-time setup process:

#### Option 1: Register a New Domain (Recommended)

1. Visit [Space.ID](https://space.id) and connect your wallet:
   ```bash
   # Make sure you have BNB in your wallet for domain registration
   # Typical costs range from 5-20 BNB depending on domain length
   ```

2. Purchase your desired .bnb domain name:
   ```bash
   # Example: your-name.bnb
   # Registration periods are typically 1-5 years
   ```

3. Set up initial resolver on BNB.me:
   ```bash
   # Visit https://bnb.me and connect the same wallet
   # Create a basic website to establish the resolver contract
   ```

#### Option 2: Use an Existing Domain

If you already have a .bnb domain:

1. Make sure you own the domain (it's registered to your wallet address)
2. Follow Step 3 from Option 1
3. Ensure you have BNB in your wallet for transaction fees

#### Verifying Domain Ownership

After registration, verify that your domain is properly set up:

```bash
# Check domain ownership and resolver
DOMAIN=your-domain.bnb npm run check
```

This will show:
1. The domain owner address (should match your wallet)
2. The resolver contract address
3. The current IPFS CID (if any)

### Quick Start

```bash
# Install dependencies
npm install

# Create .env file with your private key
echo "PRIVATE_KEY=your_wallet_private_key_here" > .env

# Check your domain's current setup
DOMAIN=your-domain.bnb npm run check

# Update your domain to point to a new IPFS hash
DOMAIN=your-domain.bnb NEW_CID=QmYourIPFSCIDv0 npm run update

# Verify the update was successful
DOMAIN=your-domain.bnb npm run verify
```

### Setting Up Your Private Key

The deployment script requires your BNB Chain private key to sign transactions. You need to set it in your `.env` file:

```bash
PRIVATE_KEY=your_wallet_private_key_here
```

#### Where to Find Your Private Key

Your private key can be exported from MetaMask or other wallet software:

1. Open MetaMask and click on the three dots next to your account
2. Select "Account Details" and then "Export Private Key"
3. Enter your password to reveal the private key
4. Copy the key (without any 0x prefix) to your .env file

#### Private Key Format

The `PRIVATE_KEY` must be in the correct format:
- It should NOT include the `0x` prefix
- It should be a 64-character hexadecimal string
- Example: `abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

⚠️ **SECURITY WARNING**: Never share your private key or commit it to version control. The `.env` file is included in `.gitignore` to prevent accidental exposure.

### Deployment Options

Deploy to your domain with a specific IPFS hash:

```bash
# Basic usage
DOMAIN=your-domain.bnb NEW_CID=QmYourIPFSCIDv0 npm run update

# For daoko.bnb (default domain)
NEW_CID=QmYourIPFSCIDv0 npm run update
```

Check your domain's current configuration:

```bash
# Basic usage
DOMAIN=your-domain.bnb npm run check

# For daoko.bnb (default domain)
npm run check
```

Verify that your domain resolves correctly:

```bash
# Basic usage
DOMAIN=your-domain.bnb npm run verify

# For daoko.bnb (default domain)
npm run verify
```

### IPFS CID Format Requirements

BNB.me works best with IPFS CIDv0 format. If you have a CIDv1 hash, convert it:

```bash
# Install IPFS CLI if you don't have it
npm install -g ipfs

# Convert CIDv1 to CIDv0
ipfs cid format -v 0 -b base58btc bafybeihsgxl4gmgzjwu4wmjvlkuqvvpqgkbf2tgwzwxwngthfj6t5zxs4a
# Output: QmQxAGS6HCwymnC8xQ2yDfFJUjCCjaFeAg5qdZ9KD1BZMM
```

### How It Works

The scripts in this directory:

1. Connect to the BNB Smart Chain network
2. Use your private key to authenticate
3. Find the resolver contract for your domain
4. Encode your IPFS CID in the format expected by the resolver
5. Submit a transaction to update the contenthash
6. Verify the update was successful

The update process:
1. `update.js`: Updates the IPFS CID with automatic resolver detection
2. `check.js`: Checks the current resolver and IPFS CID
3. `verify.js`: Verifies that the domain resolves correctly

### Technical Details

#### BNB Name Service Architecture

The BNB Name Service uses a registry-resolver architecture:
- The registry maps domain names to resolver contracts
- The resolver contracts store the actual data (like IPFS CIDs)

When you update your domain, the script:
1. Calculates the namehash of your domain
2. Queries the registry for the resolver address
3. Calls the resolver's `setContenthash` method with your encoded IPFS CID

#### Content Hash Encoding

The BNB Name Service uses a specific encoding for IPFS CIDs:
- The CID is converted to ASCII
- Each ASCII character is encoded as a two-digit hex value
- The resulting hex string is prefixed with "0x"

For example, the CID `QmQxAGS6HCwymnC8xQ2yDfFJUjCCjaFeAg5qdZ9KD1BZMM` becomes:
```
0x516d517841475336484377796d6e4338785132794466464a556a43436a61466541673571645a394b44314c5a4d4d
```

### DaokoTube's Current Deployment

The DaokoTube website is currently accessible through:

- **Domain Name**: `daoko.bnb`
- **Gateway URL**: `https://daoko.bnb.me/`
- **IPFS Address**: `QmQxAGS6HCwymnC8xQ2yDfFJUjCCjaFeAg5qdZ9KD1BZMM`
- **Direct IPFS URL**: `https://ipfs.io/ipfs/QmQxAGS6HCwymnC8xQ2yDfFJUjCCjaFeAg5qdZ9KD1BZMM`

### Troubleshooting

If you encounter errors, try these solutions:

#### Transaction Failed Errors

1. **Not Enough BNB**: Make sure your wallet has BNB tokens for transaction fees (gas)
   ```bash
   # Check your balance before updating
   # The script will show your balance when running
   ```

2. **Wrong Network**: Ensure you're connecting to the correct BNB Smart Chain network
   ```bash
   # The script uses https://bsc-dataseed.binance.org/ by default
   ```

3. **Incorrect Private Key**: Verify your private key is correct and has permission to update the domain
   ```bash
   # The script will show your wallet address when running
   # Compare it with the domain owner address
   ```

#### Website Not Updating

1. **Propagation Delay**: Changes can take 5-30 minutes to appear on BNB.me
   ```bash
   # Wait at least 30 minutes before troubleshooting further
   ```

2. **Browser Cache**: Try clearing your browser cache or using incognito mode
   ```bash
   # In Chrome: Ctrl+Shift+Delete > Clear data
   # Or use incognito mode: Ctrl+Shift+N
   ```

3. **Wrong CID Format**: Confirm you're using CIDv0 format (starting with `Qm`)
   ```bash
   # Convert CIDv1 to CIDv0 if needed
   ipfs cid format -v 0 -b base58btc your_cidv1_here
   ```

#### Debug Mode

For more detailed error information, you can examine the script output:

```bash
# The scripts provide detailed logging of each step
# Look for error messages that indicate the specific issue
```

### About BNB Domains

BNB domains (.bnb) provide several benefits:
- **Human-readable addresses**: Replace complex wallet addresses with simple names
- **Decentralized websites**: Host content through IPFS without traditional web hosting
- **Censorship resistance**: Content cannot be taken down by any central authority
- **Blockchain verification**: Ownership is secured by the BNB Smart Chain

For more information on BNB domains, see:
- [Space.ID Documentation](https://docs.space.id/)
- [BNB.me Gateway](https://bnb.me)
- [BNB Chain Documentation](https://docs.bnbchain.org/)

### Accessing Your Deployed Website

After deploying your content to IPFS and updating your BNB domain, you can access your website through:

1. **BNB.me Gateway**: `https://your-domain.bnb.me`

2. **Direct IPFS Gateway**: `https://ipfs.io/ipfs/QmYourIPFSHash`

3. **Web3-enabled Browsers**: Some browsers like Brave can directly resolve `your-domain.bnb` without a gateway

The BNB.me gateway automatically resolves your domain name to the IPFS hash stored in your resolver contract, providing a human-readable URL for your decentralized website.

## License

This project is licensed under the MIT License.
