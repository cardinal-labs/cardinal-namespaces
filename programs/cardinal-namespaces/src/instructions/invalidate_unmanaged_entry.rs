use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_token_manager::state::{TokenManager, TokenManagerState},
};

#[derive(Accounts)]
pub struct InvalidateUnmanagedEntryCtx<'info> {
    pub namespace: Account<'info, Namespace>,
    #[account(
        mut,
        close = invalidator,
        // Must invalidate reverse entry first
        constraint = entry.namespace == namespace.key() && entry.reverse_entry == None
        @ ErrorCode::InvalidEntry
    )]
    pub entry: Account<'info, Entry>,
    #[account(constraint =
        token_manager.mint == entry.mint
        && token_manager.issuer == namespace.key()
        && token_manager.state == TokenManagerState::Invalidated as u8
        @ ErrorCode::InvalidCertificate
    )]
    pub token_manager: Account<'info, TokenManager>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateUnmanagedEntryCtx>) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.data = None;
    entry.is_claimed = false;
    Ok(())
}
