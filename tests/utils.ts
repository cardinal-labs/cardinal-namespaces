import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";

export const NAMESPACE_SEED = "namespace";
export const ENTRY_SEED = "entry";
export const REVERSE_ENTRY_SEED = "reverse-entry";

/**
 * Pay and create mint and token account
 * @param connection
 * @param creator
 * @returns
 */
export const createMint = async (
  connection: web3.Connection,
  creator: web3.Keypair,
  recipient: web3.PublicKey,
  amount = 1
): Promise<[web3.PublicKey, splToken.Token]> => {
  const fromAirdropSignature = await connection.requestAirdrop(
    creator.publicKey,
    web3.LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(fromAirdropSignature);
  const mint = await splToken.Token.createMint(
    connection,
    creator,
    creator.publicKey,
    creator.publicKey,
    1,
    splToken.TOKEN_PROGRAM_ID
  );
  const tokenAccount = await mint.createAssociatedTokenAccount(recipient);
  await mint.mintTo(tokenAccount, creator.publicKey, [], amount);
  return [tokenAccount, mint];
};

/**
 * Utility function for adding a find or init associated token account instruction to a transaction
 * Useful when using associated token accounts so you can be sure they are created before hand
 * @param transaction
 * @param connection
 * @param mint
 * @param owner
 * @param payer
 * @param allowOwnerOffCurve
 * @returns The associated token account ID that was found or will be created. This also adds the relevent instruction to create it to the transaction if not found
 */
export async function withFindOrInitAssociatedTokenAccount(
  transaction: web3.Transaction,
  connection: web3.Connection,
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  payer: web3.PublicKey,
  allowOwnerOffCurve?: boolean
): Promise<web3.PublicKey> {
  const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint,
    owner,
    allowOwnerOffCurve
  );
  const account = await connection.getAccountInfo(associatedAddress);
  if (!account) {
    transaction.add(
      splToken.Token.createAssociatedTokenAccountInstruction(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        mint,
        associatedAddress,
        owner,
        payer
      )
    );
  }
  return associatedAddress;
}
