use {crate::state::*, anchor_lang::prelude::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateNamespaceIx {
    pub bump: u8,
    pub name: String,
    pub update_authority: Pubkey,
    pub rent_authority: Pubkey,
    pub approve_authority: Option<Pubkey>,
    pub schema: u8,
    // payment
    pub payment_amount_daily: u64,
    pub payment_mint: Pubkey,
    // validators
    pub min_rental_seconds: i64,
    pub max_rental_seconds: Option<i64>,
    pub transferable_entries: bool,
}

#[derive(Accounts)]
#[instruction(ix: CreateNamespaceIx)]
pub struct CreateNamespace<'info> {
    #[account(
        init,
        payer = payer,
        space = NAMESPACE_SIZE,
        seeds = [NAMESPACE_PREFIX.as_bytes(), ix.name.as_ref()],
        bump,
    )]
    pub namespace: Account<'info, Namespace>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateNamespace>, ix: CreateNamespaceIx) -> Result<()> {
    let namespace = &mut ctx.accounts.namespace;
    namespace.bump = *ctx.bumps.get("namespace").unwrap();
    namespace.name = ix.name;
    namespace.update_authority = ix.update_authority;
    namespace.rent_authority = ix.rent_authority;
    namespace.approve_authority = ix.approve_authority;
    namespace.payment_amount_daily = ix.payment_amount_daily;
    namespace.payment_mint = ix.payment_mint;
    namespace.min_rental_seconds = ix.min_rental_seconds;
    namespace.max_rental_seconds = ix.max_rental_seconds;
    namespace.schema = ix.schema;
    namespace.transferable_entries = ix.transferable_entries;
    Ok(())
}
