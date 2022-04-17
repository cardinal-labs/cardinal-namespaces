use {
    crate::{errors::*, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct UpdateGlobalNamespaceCtx<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONTEXT_PREFIX.as_bytes()],
        bump = global_context.bump,
    )]
    pub global_context: Account<'info, GlobalContext>,
    #[account(constraint = update_authority.key() == global_context.update_authority @ ErrorCode::InvalidAuthority)]
    pub update_authority: Signer<'info>,
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateGlobalNamespaceCtx>, rent_percentage: u64) -> ProgramResult {
    let global_context = &mut ctx.accounts.global_context;
    global_context.rent_percentage = rent_percentage;
    return Ok(());
}
