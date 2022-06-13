use {crate::state::*, anchor_lang::prelude::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitNameEntryIx {
    pub name: String,
}

#[derive(Accounts)]
#[instruction(ix: InitNameEntryIx)]
pub struct InitNameEntryCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(
        init,
        payer = payer,
        space = ENTRY_SIZE,
        seeds = [ENTRY_SEED.as_bytes(), namespace.key().as_ref(), ix.name.as_bytes()],
        bump,
    )]
    entry: Account<'info, Entry>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitNameEntryCtx>, ix: InitNameEntryIx) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.namespace = ctx.accounts.namespace.key();
    entry.name = ix.name.clone();
    entry.bump = *ctx.bumps.get("entry").unwrap();
    entry.data = None;
    entry.mint = Pubkey::default();
    entry.is_claimed = false;
    Ok(())
}
