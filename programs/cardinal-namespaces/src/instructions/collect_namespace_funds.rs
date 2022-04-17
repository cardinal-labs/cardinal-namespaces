use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use {
    crate::{errors::*, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CollectNamespaceFundsCtx<'info> {
    #[account(
        seeds = [GLOBAL_CONTEXT_PREFIX.as_bytes()],
        bump = global_context.bump,
    )]
    pub global_context: Account<'info, GlobalContext>,
    #[account(mut, constraint = global_namespace_payment_account.owner == global_context.key() && global_namespace_payment_account.mint == namespace.payment_mint @ ErrorCode::InvalidGlobalNamespacePaymentAccount)]
    pub global_namespace_payment_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [NAMESPACE_PREFIX.as_bytes(), namespace.name.as_ref()],
        bump = namespace.bump,
    )]
    pub namespace: Account<'info, Namespace>,
    #[account(mut, constraint = namespace_payment_account.owner == namespace.key() && namespace_payment_account.mint == namespace.payment_mint @ ErrorCode::InvalidNamespacePaymentAccount)]
    pub namespace_payment_account: Account<'info, TokenAccount>,

    #[account(constraint = namespace.rent_authority == rent_authority.key())]
    pub rent_authority: Signer<'info>,
    #[account(mut, constraint = rent_authority_token_account.owner == rent_authority.key() && rent_authority_token_account.mint == namespace.payment_mint @ ErrorCode::InvalidAuthorityTokenAccount)]
    pub rent_authority_token_account: Account<'info, TokenAccount>,

    // other
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CollectNamespaceFundsCtx>, amount: u64) -> ProgramResult {
    // get PDA seeds to sign with
    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    let global_namespace_payment = amount.checked_mul(ctx.accounts.global_context.rent_percentage).expect("Multiplication error");
    // transfer amount to authority
    let cpi_accounts = Transfer {
        from: ctx.accounts.namespace_payment_account.to_account_info(),
        to: ctx.accounts.rent_authority_token_account.to_account_info(),
        authority: ctx.accounts.namespace.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(namespace_signer);
    token::transfer(cpi_context, amount.checked_sub(global_namespace_payment).expect("Sub error"))?;

    // transfer amount to global namespace
    let cpi_accounts = Transfer {
        from: ctx.accounts.namespace_payment_account.to_account_info(),
        to: ctx.accounts.global_namespace_payment_account.to_account_info(),
        authority: ctx.accounts.namespace.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(namespace_signer);
    token::transfer(cpi_context, global_namespace_payment)?;
    Ok(())
}
