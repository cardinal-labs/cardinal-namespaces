use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_certificate::state::{Certificate, CertificateState},
    cardinal_token_manager::{
        self,
        state::{TokenManager, TokenManagerState, TOKEN_MANAGER_SEED},
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
    // #[account(constraint =
    //     certificate.mint == entry.mint
    //     && certificate.issuer == namespace.key()
    //     && certificate.state != cardinal_certificate::state::CertificateState::Invalidated as u8
    //     @ ErrorCode::InvalidCertificate
    // )]
    // certificate: Box<Account<'info, cardinal_certificate::state::Certificate>>,
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

    let mint = ctx.accounts.user_certificate_token_account.mint.key();
    let path = &[TOKEN_MANAGER_SEED.as_bytes(), mint.as_ref()];
    let (key, _) = Pubkey::find_program_address(path, ctx.program_id);
    if key == cardinal_token_manager::ID {
        // token manager
        let certificate = Account::<TokenManager>::try_from(&&ctx.accounts.certificate)?;
        if certificate.mint != mint || certificate.issuer != ctx.accounts.namespace.key() || certificate.state != TokenManagerState::Invalidated as u8 {
            return Err(error!(ErrorCode::InvalidTokenManager));
        }
    }

    // certificate
    let certificate = Account::<Certificate>::try_from(&ctx.accounts.certificate)?;
    if certificate.mint != mint || certificate.issuer != ctx.accounts.namespace.key() || certificate.state != CertificateState::Invalidated as u8 {
        return Err(error!(ErrorCode::InvalidCertificate));
    }

    Ok(())
}
