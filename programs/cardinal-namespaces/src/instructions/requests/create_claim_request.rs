use {crate::state::*, anchor_lang::prelude::*};

#[derive(Accounts)]
#[instruction(entry_name: String, claim_request_bump: u8, user: Pubkey)]
pub struct CreateClaimRequestCtx<'info> {
    namespace: Account<'info, Namespace>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = CLAIM_REQUEST_SIZE,
        seeds = [CLAIM_REQUEST_SEED.as_bytes(), namespace.key().as_ref(), entry_name.as_bytes(), user.as_ref()],
        bump,
    )]
    claim_request: Account<'info, ClaimRequest>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateClaimRequestCtx>, entry_name: String, _claim_request_bump: u8, user: Pubkey) -> Result<()> {
    let claim_request = &mut ctx.accounts.claim_request;
    claim_request.bump = *ctx.bumps.get("claim_request").unwrap();
    claim_request.requestor = user;
    claim_request.namespace = ctx.accounts.namespace.key();
    claim_request.entry_name = entry_name;
    if ctx.accounts.namespace.approve_authority != None {
        claim_request.is_approved = false;
    } else {
        claim_request.is_approved = true;
    }
    Ok(())
}
