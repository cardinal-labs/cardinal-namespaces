use {
    crate::{state::*, errors::*},
    anchor_lang::{prelude::*}
};
use anchor_spl::{
    token::{TokenAccount},
};

#[derive(Accounts)]
pub struct InvalidateManagedEntryCtx<'info> {
    pub namespace: Account<'info, Namespace>,
    #[account(
        mut,
        close = invalidator,
        // Must invalidate reverse entry first
        constraint = entry.namespace == namespace.key() && entry.reverse_entry == None
        @ ErrorCode::InvalidEntry
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut, constraint = 
        namespace_certificate_token_account.mint == entry.mint
        && namespace_certificate_token_account.owner == namespace.key()
        && namespace_certificate_token_account.amount > 0
        @ ErrorCode::NamespaceRequiresToken
    )]
    pub namespace_certificate_token_account: Account<'info, TokenAccount>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateManagedEntryCtx>) -> ProgramResult {
    let entry = &mut ctx.accounts.entry;
    entry.data = None;
    entry.is_claimed = false;
    return Ok(())
}