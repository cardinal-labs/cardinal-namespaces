use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InvalidateExpiredNameEntryCtx<'info> {
    pub namespace: Account<'info, Namespace>,
    #[account(
        mut,
        close = invalidator,
        // Must invalidate reverse entry first
        constraint = name_entry.namespace == namespace.key() && name_entry.reverse_entry == None
        @ ErrorCode::InvalidEntry
    )]
    pub name_entry: Account<'info, Entry>,
    #[account(mut, constraint =
        namespace_token_account.mint == name_entry.mint
        && namespace_token_account.owner == namespace.key()
        && namespace_token_account.amount > 0
        @ ErrorCode::NamespaceRequiresToken
    )]
    pub namespace_token_account: Account<'info, TokenAccount>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateExpiredNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.data = None;
    name_entry.is_claimed = false;
    Ok(())
}
