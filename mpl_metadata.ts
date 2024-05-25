// Import necessary libraries and modules
import {
  Collection,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  UpdateMetadataAccountV2InstructionAccounts,
  UpdateMetadataAccountV2InstructionData,
  Uses,
  createMetadataAccountV3,
  updateMetadataAccountV2,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import {
  PublicKey,
  createSignerFromKeypair,
  none,
  signerIdentity,
  some,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

// Function to load a Solana wallet key from a file
export function loadWalletKey(keypairFile: string): web3.Keypair {
  const fs = require("fs");
  const loaded = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString()))
  );
  return loaded;
}

// Variable to determine whether to initialize or update metadata
const INITIALIZE = true;

// !! CAMBIAR ARCHIVO Y DIRECCIÓN DE MINTEO DEL TOKEN !! //
// Main function to perform the metadata creation or update
async function main() {
  // Load the Solana wallet key from a file
  const myKeypair = loadWalletKey("/home/tortu/.config/solana/id.json");
  // Specify the mint (token) public key
  const mint = new web3.PublicKey(
    "HVzmNcf5tngx45boiQwoCDR465eFXw8yADjpYBrAWWCi"
  );

  // Create an instance of UMI (Unified Metadata Interface) and configure the signer
  const umi = createUmi("https://api.mainnet-beta.solana.com");
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(myKeypair));
  umi.use(signerIdentity(signer, true));

  // !! CAMBIAR METADATOS DEL TOKEN !! //
  const ourMetadata = {
    name: "TortuCoin",
    symbol: "$TORTU",
    uri: "https://raw.githubusercontent.com/mP4dilla/tortucoin/main/logo.png",
  };

  // Prepare on-chain data with metadata and additional information
  const onChainData = {
    ...ourMetadata,
    sellerFeeBasisPoints: 0,
    creators: none<Creator[]>(),
    collection: none<Collection>(),
    uses: none<Uses>(),
  };

  // Check whether to initialize or update metadata
  if (INITIALIZE) {
    // If initializing, create metadata account
    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: fromWeb3JsPublicKey(mint),
      mintAuthority: signer,
    };
    const data: CreateMetadataAccountV3InstructionDataArgs = {
      isMutable: true,
      collectionDetails: null,
      data: onChainData,
    };
    const txid = await createMetadataAccountV3(umi, {
      ...accounts,
      ...data,
    }).sendAndConfirm(umi);
    console.log(txid);
  } else {
    // If updating, update metadata account
    const data: UpdateMetadataAccountV2InstructionData = {
      data: some(onChainData),
      discriminator: 0,
      isMutable: some(true),
      newUpdateAuthority: none<PublicKey>(),
      primarySaleHappened: none<boolean>(),
    };
    const accounts: UpdateMetadataAccountV2InstructionAccounts = {
      metadata: findMetadataPda(umi, { mint: fromWeb3JsPublicKey(mint) }),
      updateAuthority: signer,
    };
    const txid = await updateMetadataAccountV2(umi, {
      ...accounts,
      ...data,
    }).sendAndConfirm(umi);
    console.log(txid);
  }
}

// Call the main function to execute the metadata creation or update
main();
