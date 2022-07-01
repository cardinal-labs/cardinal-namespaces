use crate::instructions::assert_derivation;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_token_manager::state::{TokenManager, TokenManagerState},
};

#[derive(Accounts)]
pub struct InvalidateTransferableNameEntryCtx<'info> {
    #[account(mut)]
    namespace: Account<'info, Namespace>,
    #[account(
        mut,
        close = invalidator,
        constraint = name_entry.namespace == namespace.key() && name_entry.reverse_entry == None
        @ ErrorCode::InvalidEntry
    )]
    name_entry: Account<'info, Entry>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    token_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    invalidator: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<InvalidateTransferableNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    let namespace = &mut ctx.accounts.namespace;

    // Must be valid token manager for mint
    assert_derivation(
        &cardinal_token_manager::id(),
        &ctx.accounts.token_manager.to_account_info(),
        &[cardinal_token_manager::state::TOKEN_MANAGER_SEED.as_bytes(), name_entry.mint.as_ref()],
    )?;
    if !ctx.accounts.token_manager.data_is_empty() {
        let token_manager = Account::<TokenManager>::try_from(&ctx.accounts.token_manager)?;
        if token_manager.state != TokenManagerState::Invalidated as u8 || token_manager.issuer != namespace.key() || token_manager.mint != name_entry.mint {
            return Err(ErrorCode::InvalidTokenManager.into());
        }
    }

    name_entry.data = None;
    name_entry.is_claimed = false;
    name_entry.mint = Pubkey::default();

    namespace.count = namespace.count.checked_sub(1).expect("Sub error");
    Ok(())
}
