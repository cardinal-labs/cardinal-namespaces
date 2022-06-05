use metaplex_token_metadata::{
    instruction::update_metadata_accounts,
    state::{Creator as MCreator, Data},
};
use {
    crate::{errors::*, state::*},
    anchor_lang::{prelude::*, solana_program::program::invoke_signed},
};

#[derive(Accounts)]
pub struct UpdateEntryMintMetadataCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(constraint = entry.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    entry: Box<Account<'info, Entry>>,
    #[account(constraint = approve_authority.key() == namespace.approve_authority.unwrap() @ ErrorCode::InvalidApproveAuthority)]
    approve_authority: Signer<'info>,
    #[account(mut)]
    certificate_mint_metadata: UncheckedAccount<'info>,
    token_metadata_program: UncheckedAccount<'info>,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    // In percentages, NOT basis points ;) Watch out!
    pub share: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateEntryMintMetadataIx {
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
    /// Array of creators, optional
    pub creators: Option<Vec<Creator>>,
    pub primary_sale_happened: Option<bool>,
}

pub fn handler(ctx: Context<UpdateEntryMintMetadataCtx>, args: UpdateMetadataArgs) -> ProgramResult {
    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    assert_derivation(
        &metaplex_token_metadata::id(),
        &ctx.accounts.certificate_mint_metadata.to_account_info(),
        &[
            metaplex_token_metadata::state::PREFIX.as_bytes(),
            metaplex_token_metadata::id().as_ref(),
            ctx.accounts.entry.mint.as_ref(),
        ],
    )?;

    // create metadata
    invoke_signed(
        &update_metadata_accounts(
            *ctx.accounts.token_metadata_program.key,
            *ctx.accounts.certificate_mint_metadata.key,
            ctx.accounts.namespace.key(),
            Some(ctx.accounts.namespace.key()),
            Some(Data {
                name: ctx.accounts.entry.name.clone() + "." + &ctx.accounts.namespace.name.to_string(),
                symbol: "NAME".to_string(),
                uri: "https://api.cardinal.so/metadata/".to_string() + &ctx.accounts.entry.mint.to_string(),
                creators: args.creators.map(|creators| {
                    creators
                        .iter()
                        .map(|c| MCreator {
                            address: c.address,
                            verified: c.verified,
                            share: c.share,
                        })
                        .collect()
                }),
                seller_fee_basis_points: args.seller_fee_basis_points,
            }),
            args.primary_sale_happened,
        ),
        &[ctx.accounts.certificate_mint_metadata.to_account_info(), ctx.accounts.namespace.to_account_info()],
        namespace_signer,
    )?;
    Ok(())
}

pub fn assert_derivation(program_id: &Pubkey, account: &AccountInfo, path: &[&[u8]]) -> Result<u8> {
    let (key, bump) = Pubkey::find_program_address(path, program_id);
    if key != *account.key {
        return Err(ErrorCode::InvalidEntry.into());
    }
    Ok(bump)
}
