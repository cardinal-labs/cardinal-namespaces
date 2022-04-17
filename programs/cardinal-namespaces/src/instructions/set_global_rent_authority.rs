use {
    crate::{state::*, errors::*},
    anchor_lang::{prelude::*,
}};

#[derive(Accounts)]
pub struct SetGlobalNamespaceRentAuthorityCtx<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONTEXT_PREFIX.as_bytes()],
        bump = global_context.bump,
    )]
    pub global_context: Account<'info, GlobalContext>,
    #[account(constraint = rent_authority.key() == global_context.rent_authority @ ErrorCode::InvalidAuthority)]
    pub rent_authority: Signer<'info>,
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetGlobalNamespaceRentAuthorityCtx>, rent_authority: Pubkey) -> ProgramResult {
    let global_context = &mut ctx.accounts.global_context;
    global_context.rent_authority = rent_authority;
    Ok(())
}