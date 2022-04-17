use cardinal_certificate::{
    self,
    state::{Certificate, CertificateState},
};
use {
    crate::{errors::*, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InvalidateUnmanagedEntryCtx<'info> {
    pub namespace: Account<'info, Namespace>,
    #[account(
        mut,
        close = invalidator,
        // Must invalidate reverse entry first
        constraint = entry.namespace == namespace.key() && entry.reverse_entry == None
        @ ErrorCode::InvalidEntry
    )]
    pub entry: Account<'info, Entry>,
    #[account(constraint =
        certificate.mint == entry.mint
        && certificate.issuer == namespace.key()
        && certificate.state == CertificateState::Invalidated as u8
        @ ErrorCode::InvalidCertificate
    )]
    pub certificate: Account<'info, Certificate>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateUnmanagedEntryCtx>) -> ProgramResult {
    let entry = &mut ctx.accounts.entry;
    entry.data = None;
    entry.is_claimed = false;
    return Ok(());
}
