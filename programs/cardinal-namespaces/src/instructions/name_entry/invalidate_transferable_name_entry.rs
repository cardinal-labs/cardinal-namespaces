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
        // Must invalidate reverse entry first
        constraint = name_entry.namespace == namespace.key() && name_entry.reverse_entry == None
        @ ErrorCode::InvalidEntry
    )]
    name_entry: Account<'info, Entry>,
    #[account(constraint =
        token_manager.mint == name_entry.mint
        && token_manager.issuer == namespace.key()
        && token_manager.state == TokenManagerState::Invalidated as u8
        @ ErrorCode::InvalidTokenManager
    )]
    token_manager: Account<'info, TokenManager>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    invalidator: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<InvalidateTransferableNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.data = None;
    name_entry.is_claimed = false;
    name_entry.mint = Pubkey::default();

    let namespace = &mut ctx.accounts.namespace;
    namespace.count = namespace.count.checked_sub(1).expect("Sub error");
    Ok(())
}
