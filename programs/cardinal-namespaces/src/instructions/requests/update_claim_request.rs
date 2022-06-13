use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct UpdateClaimRequestCtx<'info> {
    #[account(mut, constraint = claim_request.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    claim_request: Account<'info, ClaimRequest>,

    namespace: Account<'info, Namespace>,
    #[account(constraint = approve_authority.key() == namespace.approve_authority.unwrap() @ ErrorCode::InvalidApproveAuthority)]
    approve_authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateClaimRequestCtx>, is_approved: bool) -> Result<()> {
    let claim_request = &mut ctx.accounts.claim_request;
    claim_request.is_approved = is_approved;
    claim_request.counter = claim_request.counter.checked_add(1).unwrap();
    Ok(())
}
