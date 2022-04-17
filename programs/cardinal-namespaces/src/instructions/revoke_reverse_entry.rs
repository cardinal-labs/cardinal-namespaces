use {
    crate::{state::*, errors::*},
    anchor_lang::{prelude::*}
};

#[derive(Accounts)]
pub struct RevokeReverseEntryCtx<'info> {
    pub namespace: Box<Account<'info, Namespace>>,
    #[account(constraint =
        entry.namespace == namespace.key()
        @ ErrorCode::InvalidEntry
    )]
    pub entry: Box<Account<'info, Entry>>,
    #[account(
        mut,
        close = invalidator,
        constraint = reverse_entry.key() == entry.reverse_entry.unwrap() @ ErrorCode::InvalidReverseEntry,
    )]
    pub reverse_entry: Box<Account<'info, ReverseEntry>>,
    // you have a claim request for this entry
    #[account(mut, constraint =
        claim_request.is_approved 
        && claim_request.entry_name == entry.name
        @ ErrorCode::ClaimNotAllowed
    )]
    pub claim_request: Box<Account<'info, ClaimRequest>>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<RevokeReverseEntryCtx>) -> ProgramResult {
    let entry = &mut ctx.accounts.entry;
    entry.reverse_entry = None;
    return Ok(())
}