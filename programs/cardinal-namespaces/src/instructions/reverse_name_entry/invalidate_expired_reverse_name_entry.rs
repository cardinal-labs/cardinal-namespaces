use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InvalidateExpiredReverseNameEntryCtx<'info> {
    pub namespace: Account<'info, Namespace>,
    #[account(
        mut,
        constraint = name_entry.namespace == namespace.key()
        @ ErrorCode::InvalidEntry
    )]
    pub name_entry: Account<'info, Entry>,
    #[account(
        mut,
        close = invalidator,
        constraint = reverse_name_entry.key() == name_entry.reverse_entry.unwrap() @ ErrorCode::InvalidReverseEntry,
    )]
    pub reverse_name_entry: Account<'info, ReverseEntry>,
    #[account(mut, constraint =
        namespace_token_account.mint == name_entry.mint
        && namespace_token_account.owner == namespace.key()
        && namespace_token_account.amount > 0
        @ ErrorCode::NamespaceRequiresToken
    )]
    pub namespace_token_account: Account<'info, TokenAccount>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateExpiredReverseNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.reverse_entry = None;

    Ok(())
}
