use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CloseNameEntryCtx<'info> {
    #[account(mut, close = invalidator, constraint = invalidator.key() == namespace.update_authority @ ErrorCode::InvalidUpdateAuthority)]
    pub namespace: Account<'info, Namespace>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    invalidator: UncheckedAccount<'info>,
}

pub fn handler(_ctx: Context<CloseNameEntryCtx>) -> Result<()> {
    Ok(())
}
