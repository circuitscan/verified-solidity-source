import { getAddress } from 'viem';

const IPFS_PREFIX = 'dweb:/ipfs/';

export default async function(contractAddress, chainId = 1, matchType = 'full_match') {
  const baseUrl = `https://repo.sourcify.dev/contracts/${matchType}/${chainId}/${getAddress(contractAddress)}/metadata.json`;
  const response = await fetch(baseUrl);
  
  // Check if the response is successful
  if (!response.ok) {
    if(response.status === 404) return null;
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  // Parse the response JSON
  const data = await response.json();

  // Extract/load the Solidity source code
  const soliditySource = data.sources;
  for(let file of Object.keys(soliditySource)) {
    if(!('content' in soliditySource[file]) && soliditySource[file].urls instanceof Array) {
      const ipfsUrl = soliditySource[file].urls.find(x => String(x).startsWith(IPFS_PREFIX));
      const ipfsData = await fetch(
        `${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${ipfsUrl.slice(IPFS_PREFIX.length)}`
      );
      soliditySource[file].content = await ipfsData.text();

    }
  }

  // Returning the Solidity source code
  return soliditySource;
}
