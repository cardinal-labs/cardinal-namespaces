use {
    crate::{errors::ErrorCode, instructions::assert_derivation, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct UpdateClaimRequestCtx<'info> {
    /// CHECK: This is not dangerous because we check inside the handler
    name_entry: UncheckedAccount<'info>,
    namespace: Account<'info, Namespace>,
    #[account(constraint = approve_authority.key() == namespace.approve_authority.unwrap() @ ErrorCode::InvalidApproveAuthority)]
    approve_authority: Signer<'info>,
    #[account(mut, constraint = rent_request.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    rent_request: Account<'info, ClaimRequest>,
}

pub fn handler(ctx: Context<UpdateClaimRequestCtx>, is_approved: bool) -> Result<()> {
    let rent_request = &mut ctx.accounts.rent_request;
    rent_request.is_approved = is_approved;
    rent_request.counter = 0;

    assert_derivation(
        &ctx.program_id,
        &ctx.accounts.name_entry.to_account_info(),
        &[ENTRY_SEED.as_bytes(), ctx.accounts.namespace.key().as_ref(), rent_request.entry_name.as_bytes()],
    )?;

    if !ctx.accounts.name_entry.data_is_empty() {
        let name_entry = Account::<Entry>::try_from(&ctx.accounts.name_entry)?;
        rent_request.counter = name_entry.claim_request_counter;
    }
    Ok(())
}
