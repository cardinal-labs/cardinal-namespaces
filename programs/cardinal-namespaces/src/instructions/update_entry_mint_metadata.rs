use metaplex_token_metadata::{instruction::update_metadata_accounts, state::Data};
use {
    crate::{errors::*, state::*},
    anchor_lang::{prelude::*, solana_program::program::invoke_signed},
};

#[derive(Accounts)]
pub struct UpdateEntryMintMetadataCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(constraint = entry.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    entry: Box<Account<'info, Entry>>,
    #[account(mut)]
    certificate_mint_metadata: UncheckedAccount<'info>,
    token_metadata_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<UpdateEntryMintMetadataCtx>) -> ProgramResult {
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
                creators: None,
                seller_fee_basis_points: 0,
            }),
            None,
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
