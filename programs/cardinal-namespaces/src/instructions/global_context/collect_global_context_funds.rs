use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CollectGlobalContextFunds<'info> {
    #[account(seeds = [GLOBAL_CONTEXT_PREFIX.as_bytes()], bump = global_context.bump)]
    pub global_context: Account<'info, GlobalContext>,
    #[account(mut, constraint = global_context_payment_account.owner == global_context.key() @ ErrorCode::InvalidGlobalContextPaymentAccount)]
    pub global_context_payment_account: Account<'info, TokenAccount>,

    #[account(constraint = global_context.rent_authority == rent_authority.key())]
    pub rent_authority: Signer<'info>,
    #[account(mut, constraint = authority_token_account.owner == rent_authority.key() @ ErrorCode::InvalidAuthorityTokenAccount)]
    pub authority_token_account: Account<'info, TokenAccount>,

    // other
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CollectGlobalContextFunds>, amount: u64) -> Result<()> {
    // get PDA seeds to sign with
    let global_context_seeds = &[GLOBAL_CONTEXT_PREFIX.as_bytes(), &[ctx.accounts.global_context.bump]];
    let global_context_signer = &[&global_context_seeds[..]];

    // transfer amount to authority
    let cpi_accounts = Transfer {
        from: ctx.accounts.global_context_payment_account.to_account_info(),
        to: ctx.accounts.authority_token_account.to_account_info(),
        authority: ctx.accounts.global_context.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(global_context_signer);
    token::transfer(cpi_context, amount)?;
    Ok(())
}
