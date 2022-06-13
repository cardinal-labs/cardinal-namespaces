use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_token_manager::state::{TokenManager, TokenManagerState},
};

#[derive(Accounts)]
pub struct SetNamespaceReverseEntryCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(mut)]
    entry: Box<Account<'info, Entry>>,
    #[account(
        init_if_needed,
        payer = payer,
        space = REVERSE_ENTRY_SIZE,
        seeds = [REVERSE_ENTRY_SEED.as_bytes(), namespace.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    reverse_entry: Box<Account<'info, ReverseEntry>>,

    #[account(constraint =
        user_token_account.mint == entry.mint
        && user_token_account.owner == user.key()
        && user_token_account.amount > 0
        @ ErrorCode::InvalidOwnerMint
    )]
    user_token_account: Box<Account<'info, TokenAccount>>,
    #[account(constraint =
        token_manager.mint == entry.mint
        && token_manager.issuer == namespace.key()
        && token_manager.state != TokenManagerState::Invalidated as u8
        @ ErrorCode::InvalidTokenManager
    )]
    token_manager: Box<Account<'info, TokenManager>>,

    #[account(mut)]
    user: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetNamespaceReverseEntryCtx>) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.reverse_entry = Some(ctx.accounts.reverse_entry.key());

    let reverse_entry = &mut ctx.accounts.reverse_entry;
    reverse_entry.bump = *ctx.bumps.get("reverse_entry").unwrap();
    reverse_entry.namespace_name = ctx.accounts.namespace.name.clone();
    reverse_entry.entry_name = entry.name.clone();
    Ok(())
}
