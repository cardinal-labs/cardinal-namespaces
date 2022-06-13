use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateGlobalContextIx {
    pub update_authority: Option<Pubkey>,
    pub rent_authority: Option<Pubkey>,
    pub fee_basis_points: Option<u64>,
}

#[derive(Accounts)]
pub struct UpdateGlobalContextCtx<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONTEXT_PREFIX.as_bytes()],
        bump = global_context.bump,
    )]
    pub global_context: Account<'info, GlobalContext>,
    #[account(constraint = update_authority.key() == global_context.update_authority @ ErrorCode::InvalidAuthority)]
    pub update_authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateGlobalContextCtx>, ix: UpdateGlobalContextIx) -> Result<()> {
    let global_context = &mut ctx.accounts.global_context;
    global_context.fee_basis_points = ix.fee_basis_points.unwrap_or(global_context.fee_basis_points);
    global_context.update_authority = ix.update_authority.unwrap_or(global_context.update_authority);
    global_context.rent_authority = ix.rent_authority.unwrap_or(global_context.rent_authority);
    Ok(())
}
