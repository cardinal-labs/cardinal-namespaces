use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{Mint, Token},
};
use cardinal_certificate::{
    self,
    cpi::accounts::{ClaimCertificateCtx, IssueCertificateCtx},
    instructions::IssueCertificateIx,
    program::CardinalCertificate,
    state::CertificateKind,
};
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ClaimEntryIx {
    pub duration: Option<i64>,
    pub certificate_bump: u8,
}

#[derive(Accounts)]
#[instruction(ix: ClaimEntryIx)]
pub struct ClaimEntry<'info> {
    #[account(mut)]
    namespace: Box<Account<'info, Namespace>>,
    #[account(
        mut,
        seeds = [ENTRY_SEED.as_bytes(), namespace.key().as_ref(), entry.name.as_bytes()],
        bump = entry.bump,
    )]
    entry: Box<Account<'info, Entry>>,
    #[account(mut)]
    user: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    // TODO move this check into the handler so it can be unchecked account
    #[account(mut,
        close = namespace,
        constraint = claim_request.is_approved
        && claim_request.namespace == namespace.key()
        && claim_request.entry_name == entry.name
        && claim_request.requestor == user.key()
        && claim_request.counter == entry.claim_request_counter
        @ ErrorCode::ClaimNotAllowed
    )]
    claim_request: Box<Account<'info, ClaimRequest>>,

    // payment
    #[account(mut, constraint = payment_mint.key() == namespace.payment_mint @ ErrorCode::InvalidPaymentMint)]
    payment_mint: Box<Account<'info, Mint>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    namespace_certificate_token_account: UncheckedAccount<'info>,

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
    associated_token: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimEntry>, ix: ClaimEntryIx) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.data = Some(ctx.accounts.user.key());
    entry.is_claimed = true;
    entry.claim_request_counter = entry.claim_request_counter.checked_add(1).expect("Add error");

    // duration checks
    if ix.duration != None {
        if ix.duration.unwrap() <= ctx.accounts.namespace.min_rental_seconds {
            return Err(error!(ErrorCode::RentalDurationTooSmall));
        }
        if ctx.accounts.namespace.max_rental_seconds != None && ix.duration.unwrap() >= ctx.accounts.namespace.max_rental_seconds.unwrap() {
            return Err(error!(ErrorCode::RentalDurationTooLarge));
        }
    } else if ctx.accounts.namespace.max_rental_seconds != None {
        return Err(error!(ErrorCode::NamespaceRequiresDuration));
    }

    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    if ctx.accounts.certificate_token_account.data_is_empty() {
        // create associated token account for certificate mint
        let cpi_accounts = associated_token::Create {
            payer: ctx.accounts.payer.to_account_info(),
            associated_token: ctx.accounts.certificate_token_account.to_account_info(),
            authority: ctx.accounts.certificate.to_account_info(),
            mint: ctx.accounts.certificate_mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        associated_token::create(cpi_context)?;
    }

    // issue certificate
    let certificate_program = ctx.accounts.certificate_program.to_account_info();
    let cpi_accounts = IssueCertificateCtx {
        mint_manager: ctx.accounts.mint_manager.to_account_info(),
        certificate: ctx.accounts.certificate.to_account_info(),
        certificate_mint: ctx.accounts.certificate_mint.to_account_info(),
        certificate_token_account: ctx.accounts.certificate_token_account.to_account_info(),
        issuer: ctx.accounts.namespace.to_account_info(),
        issuer_token_account: ctx.accounts.namespace_certificate_token_account.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let mut payment_amount: Option<u64> = None;
    if ix.duration != None {
        payment_amount = Some((ctx.accounts.namespace.payment_amount_daily as f64 * (ix.duration.unwrap() as f64) / (60 * 60 * 24) as f64) as u64);
    }
    let create_certificate_ix = IssueCertificateIx {
        // basic
        amount: 1,
        kind: if ctx.accounts.namespace.transferable_entries {
            CertificateKind::Unmanaged as u8
        } else {
            CertificateKind::Managed as u8
        },
        bump: ix.certificate_bump,
        recipient: Some(ctx.accounts.user.key()),
        // payment -- as u64 floors the decimal payment
        payment_amount,
        payment_mint: Some(ctx.accounts.namespace.payment_mint),
        // time expiry
        duration: ix.duration,
        start_at_issuance: Some(false),
        // usage expiry
        total_usages: None,
        // manual expiry
        revoke_authority: Some(ctx.accounts.namespace.key()),
        // invalidation
        is_returnable: true,
        is_extendable: true,
    };
    let cpi_ctx = CpiContext::new(certificate_program, cpi_accounts).with_signer(namespace_signer);
    cardinal_certificate::cpi::issue_certificate(cpi_ctx, create_certificate_ix)?;

    // claim certificate
    let certificate_program = ctx.accounts.certificate_program.to_account_info();
    let cpi_accounts = ClaimCertificateCtx {
        mint_manager: ctx.accounts.mint_manager.to_account_info(),
        certificate: ctx.accounts.certificate.to_account_info(),
        certificate_mint: ctx.accounts.certificate_mint.to_account_info(),
        certificate_token_account: ctx.accounts.certificate_token_account.to_account_info(),
        certificate_payment_token_account: ctx.accounts.certificate_payment_token_account.to_account_info(),
        recipient: ctx.accounts.user.to_account_info(),
        recipient_token_account: ctx.accounts.user_certificate_token_account.to_account_info(),
        recipient_payment_token_account: ctx.accounts.user_payment_token_account.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(certificate_program, cpi_accounts);
    cardinal_certificate::cpi::claim_certificate(cpi_ctx)?;
    Ok(())
}
