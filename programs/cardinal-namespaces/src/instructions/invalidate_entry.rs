use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::Token,
    cardinal_token_manager::program::CardinalTokenManager,
};

#[derive(Accounts)]
pub struct InvalidateEntryCtx<'info> {
    #[account(mut)]
    pub namespace: Account<'info, Namespace>,
    #[account(mut, constraint = entry.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    pub entry: Box<Account<'info, Entry>>,
    #[account(mut,
        constraint =
        claim_request.is_approved
        && claim_request.namespace == namespace.key()
        && claim_request.entry_name == entry.name
        @ ErrorCode::ClaimNotAllowed
    )]
    pub claim_request: Box<Account<'info, ClaimRequest>>,
    pub invalidator: Signer<'info>,

    // CPI accounts
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub token_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub token_manager_token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub user_recipient_token_account: UncheckedAccount<'info>,

    // programs
    token_manager_program: Program<'info, CardinalTokenManager>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, InvalidateEntryCtx<'info>>) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.data = None;
    entry.is_claimed = false;

    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    let cpi_accounts = cardinal_token_manager::cpi::accounts::InvalidateCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        token_manager_token_account: ctx.accounts.token_manager_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        recipient_token_account: ctx.accounts.user_recipient_token_account.to_account_info(),
        invalidator: ctx.accounts.invalidator.to_account_info(),
        collector: ctx.accounts.namespace.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts)
        .with_remaining_accounts(ctx.remaining_accounts.to_vec())
        .with_signer(namespace_signer);
    cardinal_token_manager::cpi::invalidate(cpi_ctx)?;
    Ok(())
}
