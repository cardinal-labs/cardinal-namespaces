use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_certificate::{
        self,
        state::{Certificate, CertificateState, CERTIFICATE_SEED},
    },
    cardinal_token_manager::state::{TokenManager, TokenManagerState},
};

#[derive(Accounts)]
pub struct SetNamespaceReverseNameEntryCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(mut)]
    name_entry: Box<Account<'info, Entry>>,
    #[account(
        init_if_needed,
        payer = payer,
        space = REVERSE_ENTRY_SIZE,
        seeds = [REVERSE_ENTRY_SEED.as_bytes(), namespace.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    reverse_entry: Box<Account<'info, ReverseEntry>>,

    #[account(constraint =
        user_token_account.mint == name_entry.mint
        && user_token_account.owner == user.key()
        && user_token_account.amount > 0
        @ ErrorCode::InvalidOwnerMint
    )]
    user_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    token_manager: AccountInfo<'info>,

    #[account(mut)]
    user: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetNamespaceReverseNameEntryCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.reverse_entry = Some(ctx.accounts.reverse_entry.key());

    let reverse_entry = &mut ctx.accounts.reverse_entry;
    reverse_entry.bump = *ctx.bumps.get("reverse_entry").unwrap();
    reverse_entry.entry_name = name_entry.name.clone();
    reverse_entry.namespace_name = ctx.accounts.namespace.name.clone();

    let mint = ctx.accounts.user_token_account.mint.key();
    let path = &[CERTIFICATE_SEED.as_bytes(), mint.as_ref()];
    let (key, _) = Pubkey::find_program_address(path, ctx.program_id);
    if key == cardinal_certificate::ID {
        // certificate
        let certificate = Account::<Certificate>::try_from(&ctx.accounts.token_manager)?;
        if certificate.mint != mint || certificate.issuer != ctx.accounts.namespace.key() || certificate.state != CertificateState::Invalidated as u8 {
            return Err(error!(ErrorCode::InvalidTokenManager));
        }
    }

    // token manager
    let token_manager = Account::<TokenManager>::try_from(&ctx.accounts.token_manager)?;
    if token_manager.mint != mint || token_manager.issuer != ctx.accounts.namespace.key() || token_manager.state != TokenManagerState::Invalidated as u8 {
        return Err(error!(ErrorCode::InvalidTokenManager));
    }

    Ok(())
}
