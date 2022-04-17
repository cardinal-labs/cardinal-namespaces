use {
    crate::{errors::*, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct UpdateClaimRequestCtx<'info> {
    namespace: Account<'info, Namespace>,
    #[account(constraint = approve_authority.key() == namespace.approve_authority.unwrap() @ ErrorCode::InvalidApproveAuthority)]
    approve_authority: Signer<'info>,
    #[account(
        mut,
        constraint = rent_request.namespace == namespace.key() @ ErrorCode::InvalidNamespace
    )]
    rent_request: Account<'info, ClaimRequest>,
}

pub fn handler(ctx: Context<UpdateClaimRequestCtx>, is_approved: bool) -> ProgramResult {
    let rent_request = &mut ctx.accounts.rent_request;
    rent_request.is_approved = is_approved;
    return Ok(());
}
