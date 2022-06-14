use super::init_name_entry_mint::Creator;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::{prelude::*, solana_program::program::invoke_signed},
    mpl_token_metadata::{
        instruction::update_metadata_accounts_v2,
        state::{Creator as MCreator, DataV2},
    },
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateNameEntryMintMetadataIx {
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
    /// Array of creators, optional
    pub creators: Option<Vec<Creator>>,
    pub primary_sale_happened: Option<bool>,
}

#[derive(Accounts)]
pub struct UpdateNameEntryMintMetadataCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(constraint = name_entry.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    name_entry: Box<Account<'info, Entry>>,
    #[account(constraint = update_authority.key() == namespace.update_authority @ ErrorCode::InvalidAuthority)]
    update_authority: Signer<'info>,
    #[account(mut)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    mint_metadata: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    token_metadata_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<UpdateNameEntryMintMetadataCtx>, ix: UpdateNameEntryMintMetadataIx) -> Result<()> {
    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    assert_derivation(
        &mpl_token_metadata::id(),
        &ctx.accounts.mint_metadata.to_account_info(),
        &[mpl_token_metadata::state::PREFIX.as_bytes(), mpl_token_metadata::id().as_ref(), ctx.accounts.name_entry.mint.as_ref()],
    )?;

    // update metadata
    invoke_signed(
        &update_metadata_accounts_v2(
            *ctx.accounts.token_metadata_program.key,
            *ctx.accounts.mint_metadata.key,
            ctx.accounts.namespace.key(),
            Some(ctx.accounts.namespace.key()),
            Some(DataV2 {
                name: ctx.accounts.name_entry.name.clone() + "." + &ctx.accounts.namespace.name.to_string(),
                symbol: "NAME".to_string(),
                uri: "https://nft.cardinal.so/metadata/".to_string() + &ctx.accounts.name_entry.mint.to_string() + &"?name=".to_string() + &ctx.accounts.name_entry.name.to_string(),
                creators: Some(
                    [
                        vec![Creator {
                            address: ctx.accounts.namespace.key(),
                            verified: true,
                            share: 0,
                        }],
                        ix.creators.unwrap_or(vec![]),
                    ]
                    .concat()
                    .iter()
                    .map(|c| MCreator {
                        address: c.address,
                        verified: c.verified,
                        share: c.share,
                    })
                    .collect(),
                ),
                seller_fee_basis_points: ix.seller_fee_basis_points,
                collection: None,
                uses: None,
            }),
            ix.primary_sale_happened,
            Some(true),
        ),
        &[ctx.accounts.mint_metadata.to_account_info(), ctx.accounts.namespace.to_account_info()],
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
