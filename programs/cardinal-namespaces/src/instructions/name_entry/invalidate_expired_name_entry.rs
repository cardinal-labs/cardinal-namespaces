use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InvalidateExpiredNameEntryCtx<'info> {
    #[account(mut)]
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
    /// CHECK: This is not dangerous because we don't read or write from this account
    invalidator: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<InvalidateExpiredNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.data = None;
    name_entry.is_claimed = false;

    let namespace = &mut ctx.accounts.namespace;
    namespace.count = namespace.count.checked_sub(1).expect("Sub error");
    Ok(())
}
