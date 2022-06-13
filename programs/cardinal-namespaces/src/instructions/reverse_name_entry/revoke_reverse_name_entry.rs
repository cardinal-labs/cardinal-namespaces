use anchor_lang::AccountsClose;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct RevokeReverseNameEntryCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(constraint = name_entry.namespace == namespace.key() @ ErrorCode::InvalidEntry)]
    name_entry: Box<Account<'info, Entry>>,
    #[account(
        mut,
        close = invalidator,
        constraint = reverse_entry.key() == name_entry.reverse_entry.unwrap() @ ErrorCode::InvalidReverseEntry,
    )]
    reverse_entry: Box<Account<'info, ReverseEntry>>,
    // you have a claim request for this entry
    #[account(mut, constraint =
        claim_request.is_approved
        && claim_request.namespace == namespace.key()
        && claim_request.entry_name == name_entry.name
        && claim_request.counter == name_entry.claim_request_counter
        @ ErrorCode::ClaimNotAllowed
    )]
    claim_request: Box<Account<'info, ClaimRequest>>,
    invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<RevokeReverseNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.reverse_entry = None;
    Ok(())
}
