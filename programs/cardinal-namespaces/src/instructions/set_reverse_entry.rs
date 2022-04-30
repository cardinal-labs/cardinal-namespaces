use anchor_lang::Discriminator;
use anchor_spl::token::TokenAccount;
use cardinal_certificate::{self};
use {
    crate::{errors::*, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(reverse_entry_bump: u8)]
pub struct SetReverseEntryCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(
        mut,
        seeds = [ENTRY_SEED.as_bytes(), namespace.key().as_ref(), entry.name.as_bytes()],
        bump = entry.bump,
    )]
    entry: Box<Account<'info, Entry>>,
    #[account(
        init_if_needed,
        payer = payer,
        space = REVERSE_ENTRY_SIZE,
        seeds = [REVERSE_ENTRY_SEED.as_bytes(), user.key().as_ref()],
        bump = reverse_entry_bump,
    )]
    reverse_entry: Box<Account<'info, ReverseEntry>>,

    #[account(constraint =
        user_certificate_token_account.mint == entry.mint
        && user_certificate_token_account.owner == user.key()
        && user_certificate_token_account.amount > 0
        @ ErrorCode::InvalidOwnerMint
    )]
    user_certificate_token_account: Box<Account<'info, TokenAccount>>,
    #[account(constraint =
        certificate.mint == entry.mint
        && certificate.issuer == namespace.key()
        && certificate.state != cardinal_certificate::state::CertificateState::Invalidated as u8
        @ ErrorCode::InvalidCertificate
    )]
    certificate: Box<Account<'info, cardinal_certificate::state::Certificate>>,

    #[account(mut)]
    user: Signer<'info>,
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetReverseEntryCtx>, reverse_entry_bump: u8) -> ProgramResult {
    let entry = &mut ctx.accounts.entry;
    entry.reverse_entry = Some(ctx.accounts.reverse_entry.key());

    // discriminator check
    let acct = ctx.accounts.reverse_entry.to_account_info();
    let data: &[u8] = &acct.try_borrow_data()?;
    let disc_bytes = &data[..8];
    if disc_bytes != ReverseEntry::discriminator() && disc_bytes.iter().any(|a| a != &0) {
        return Err(ErrorCode::AccountDiscriminatorMismatch.into());
    }

    let reverse_entry = &mut ctx.accounts.reverse_entry;
    reverse_entry.bump = reverse_entry_bump;
    reverse_entry.namespace_name = ctx.accounts.namespace.name.clone();
    reverse_entry.entry_name = entry.name.clone();
    Ok(())
}
