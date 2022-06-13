use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_token_manager::state::TokenManagerState,
};

#[derive(Accounts)]
pub struct InvalidateUnmanagedReverseEntryCtx<'info> {
    pub namespace: Account<'info, Namespace>,
    #[account(
        mut,
        constraint = entry.namespace == namespace.key()
        @ ErrorCode::InvalidEntry
    )]
    pub entry: Account<'info, Entry>,
    #[account(
        mut,
        close = invalidator,
        constraint = reverse_entry.key() == entry.reverse_entry.unwrap() @ ErrorCode::InvalidReverseEntry,
    )]
    pub reverse_entry: Account<'info, ReverseEntry>,
    #[account(constraint =
        token_manager.mint == entry.mint
        && token_manager.issuer == namespace.key()
        && token_manager.state == TokenManagerState::Invalidated as u8
        @ ErrorCode::InvalidTokenManager
    )]
    pub token_manager: Account<'info, cardinal_certificate::state::Certificate>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateUnmanagedReverseEntryCtx>) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.reverse_entry = None;
    Ok(())
}
