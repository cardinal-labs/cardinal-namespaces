use {crate::state::*, anchor_lang::prelude::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeGlobalNamespaceIx {
    pub rent_percentage: u64,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(ix: InitializeGlobalNamespaceIx)]
pub struct InitializeGlobalNamespaceCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = GLOBAL_CONTEXT_SIZE,
        seeds = [GLOBAL_CONTEXT_PREFIX.as_bytes()],
        bump,
    )]
    pub global_context: Account<'info, GlobalContext>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeGlobalNamespaceCtx>, ix: InitializeGlobalNamespaceIx) -> Result<()> {
    let global_context = &mut ctx.accounts.global_context;
    global_context.bump = *ctx.bumps.get("global_context").unwrap();
    global_context.update_authority = ctx.accounts.authority.key();
    global_context.rent_authority = ctx.accounts.authority.key();
    global_context.rent_percentage = ix.rent_percentage;
    Ok(())
}
