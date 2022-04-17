use anchor_spl::token::TokenAccount;
use {
    crate::{errors::*, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InvalidateManagedReverseEntryCtx<'info> {
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
    #[account(mut, constraint =
        namespace_certificate_token_account.mint == entry.mint
        && namespace_certificate_token_account.owner == namespace.key()
        && namespace_certificate_token_account.amount > 0
        @ ErrorCode::NamespaceRequiresToken
    )]
    pub namespace_certificate_token_account: Account<'info, TokenAccount>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateManagedReverseEntryCtx>) -> ProgramResult {
    let entry = &mut ctx.accounts.entry;
    entry.reverse_entry = None;
    Ok(())
}
