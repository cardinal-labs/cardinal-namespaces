use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_token_manager::state::{TokenManager, TokenManagerState},
};

#[derive(Accounts)]
pub struct InvalidateTransferableReverseNameEntryCtx<'info> {
    namespace: Account<'info, Namespace>,
    #[account(
        mut,
        constraint = name_entry.namespace == namespace.key()
        @ ErrorCode::InvalidEntry
    )]
    name_entry: Account<'info, Entry>,
    #[account(
        mut,
        close = invalidator,
        constraint = reverse_name_entry.key() == name_entry.reverse_entry.unwrap() @ ErrorCode::InvalidReverseEntry,
    )]
    reverse_name_entry: Account<'info, ReverseEntry>,
    #[account(constraint =
        token_manager.mint == name_entry.mint
        && token_manager.issuer == namespace.key()
        && token_manager.state == TokenManagerState::Invalidated as u8
        @ ErrorCode::InvalidTokenManager
    )]
    token_manager: Account<'info, TokenManager>,
    invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateTransferableReverseNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.reverse_entry = None;

    Ok(())
}
