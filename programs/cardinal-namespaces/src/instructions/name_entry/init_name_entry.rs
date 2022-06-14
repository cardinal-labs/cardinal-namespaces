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
    name_entry: Account<'info, Entry>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitNameEntryCtx>, ix: InitNameEntryIx) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.bump = *ctx.bumps.get("name_entry").unwrap();
    name_entry.namespace = ctx.accounts.namespace.key();
    name_entry.name = ix.name.clone();
    name_entry.mint = Pubkey::default();
    name_entry.is_claimed = false;
    Ok(())
}
