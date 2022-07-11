use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_certificate::state::{Certificate, CertificateState},
    cardinal_token_manager::{
        self,
        state::{TokenManager, TokenManagerState},
    },
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
        bump,
    )]
    reverse_entry: Box<Account<'info, ReverseEntry>>,

    #[account(constraint =
        user_certificate_token_account.mint == entry.mint
        && user_certificate_token_account.owner == user.key()
        && user_certificate_token_account.amount > 0
        @ ErrorCode::InvalidOwnerMint
    )]
    user_certificate_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    certificate: AccountInfo<'info>,

    #[account(mut)]
    user: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetReverseEntryCtx>, _reverse_entry_bump: u8) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.reverse_entry = Some(ctx.accounts.reverse_entry.key());

    let reverse_entry = &mut ctx.accounts.reverse_entry;
    reverse_entry.bump = *ctx.bumps.get("reverse_entry").unwrap();
    reverse_entry.namespace_name = ctx.accounts.namespace.name.clone();
    reverse_entry.entry_name = entry.name.clone();

    let mint = ctx.accounts.entry.mint.key();
    if ctx.accounts.certificate.owner.key() == cardinal_certificate::ID {
        // token manager
        let token_manager = Account::<Certificate>::try_from(&ctx.accounts.certificate).expect("Invalid token manager");
        if token_manager.mint != mint || token_manager.issuer != ctx.accounts.namespace.key() || token_manager.state == TokenManagerState::Invalidated as u8 {
            return Err(error!(ErrorCode::InvalidCertificate));
        }
    } else if ctx.accounts.certificate.owner.key() == cardinal_token_manager::ID {
        // certificate
        let certificate = Account::<TokenManager>::try_from(&ctx.accounts.certificate).expect("Invalid certificate");
        if certificate.mint != mint || certificate.issuer != ctx.accounts.namespace.key() || certificate.state == CertificateState::Invalidated as u8 {
            return Err(error!(ErrorCode::InvalidTokenManager));
        }
    } else {
        return Err(error!(ErrorCode::InvalidTokenManagerOrCertificate));
    }

    Ok(())
}
