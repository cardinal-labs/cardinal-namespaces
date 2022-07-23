use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(entry_name: String, user: Pubkey)]
pub struct ApproveClaimRequestCtx<'info> {
    namespace: Account<'info, Namespace>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        space = CLAIM_REQUEST_SIZE,
        seeds = [CLAIM_REQUEST_SEED.as_bytes(), namespace.key().as_ref(), entry_name.as_bytes(), user.as_ref()],
        bump,
    )]
    claim_request: Account<'info, ClaimRequest>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    name_entry: UncheckedAccount<'info>,

    #[account(constraint = approve_authority.key() == namespace.approve_authority.unwrap() @ ErrorCode::InvalidApproveAuthority)]
    approve_authority: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ApproveClaimRequestCtx>, entry_name: String, user: Pubkey) -> Result<()> {
    let claim_request = &mut ctx.accounts.claim_request;
    claim_request.bump = *ctx.bumps.get("claim_request").unwrap();
    claim_request.namespace = ctx.accounts.namespace.key();
    claim_request.entry_name = entry_name;
    claim_request.is_approved = true;
    claim_request.requestor = user;
    claim_request.counter = 0;

    if !ctx.accounts.name_entry.data_is_empty() {
        let name_entry = Account::<Entry>::try_from(&ctx.accounts.name_entry)?;
        claim_request.counter = name_entry.claim_request_counter;
    }

    Ok(())
}
