use anchor_spl::token::{Token, TokenAccount};
use cardinal_certificate::{self, cpi::accounts::RevokeCertificateCtx, program::CardinalCertificate};
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct RevokeEntryCtx<'info> {
    #[account(mut)]
    namespace: Account<'info, Namespace>,
    #[account(mut, constraint = entry.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    entry: Box<Account<'info, Entry>>,
    #[account(mut,
        constraint =
        claim_request.is_approved
        && claim_request.namespace == namespace.key()
        && claim_request.entry_name == entry.name
        && claim_request.counter == entry.claim_request_counter
        @ ErrorCode::ClaimNotAllowed
    )]
    claim_request: Box<Account<'info, ClaimRequest>>,

    #[account(mut, constraint =
        namespace_certificate_token_account.mint == entry.mint
        && namespace_certificate_token_account.owner == namespace.key()
        @ ErrorCode::NamespaceRequiresToken
    )]
    namespace_certificate_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint =
        // TODO parse certificate here and use certificate payment mint? in case it has changed in the namespace
        namespace_payment_token_account.mint == namespace.payment_mint
        && namespace_payment_token_account.owner == namespace.key()
        @ ErrorCode::NamespaceRequiresToken
    )]
    namespace_payment_token_account: Box<Account<'info, TokenAccount>>,
    invalidator: Signer<'info>,

    // CPI accounts
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    certificate: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    certificate_mint: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    certificate_token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    certificate_payment_token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    user_certificate_token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    user_payment_token_account: UncheckedAccount<'info>,

    // programs
    certificate_program: Program<'info, CardinalCertificate>,
    token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<RevokeEntryCtx>) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.data = None;
    entry.is_claimed = false;

    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    // revoke certificate
    let certificate_program = ctx.accounts.certificate_program.to_account_info();
    let cpi_accounts = RevokeCertificateCtx {
        mint_manager: ctx.accounts.mint_manager.to_account_info(),
        certificate: ctx.accounts.certificate.to_account_info(),
        certificate_mint: ctx.accounts.certificate_mint.to_account_info(),
        certificate_token_account: ctx.accounts.certificate_token_account.to_account_info(),
        certificate_payment_token_account: ctx.accounts.certificate_payment_token_account.to_account_info(),

        recipient_token_account: ctx.accounts.user_certificate_token_account.to_account_info(),
        recipient_payment_token_account: ctx.accounts.user_payment_token_account.to_account_info(),

        issuer_token_account: ctx.accounts.namespace_certificate_token_account.to_account_info(),
        issuer_payment_token_account: ctx.accounts.namespace_payment_token_account.to_account_info(),

        revoke_authority: ctx.accounts.namespace.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(certificate_program, cpi_accounts).with_signer(namespace_signer);
    cardinal_certificate::cpi::revoke_certificate(cpi_ctx)?;

    Ok(())
}
