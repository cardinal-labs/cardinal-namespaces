use anchor_spl::token::TokenAccount;
use cardinal_certificate::{self};
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(data: Pubkey)]
pub struct SetEntryData<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(
        mut,
        seeds = [ENTRY_SEED.as_bytes(), namespace.key().as_ref(), entry.name.as_bytes()],
        bump = entry.bump,
    )]
    entry: Box<Account<'info, Entry>>,

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

pub fn handler(ctx: Context<SetEntryData>, _data: Pubkey) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.data = Some(ctx.accounts.user.key());
    Ok(())
}
