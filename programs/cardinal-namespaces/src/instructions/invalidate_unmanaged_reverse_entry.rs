use cardinal_certificate::{self};
use {
    crate::{errors::*, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InvalidateUnmanagedReverseEntryCtx<'info> {
    pub namespace: Account<'info, Namespace>,
    #[account(
        mut,
        constraint = entry.namespace == namespace.key()
        @ ErrorCode::InvalidEntry
    )]
    pub entry: Account<'info, Entry>,
    #[account(
        mut,
        close = invalidator,
        constraint = reverse_entry.key() == entry.reverse_entry.unwrap() @ ErrorCode::InvalidReverseEntry,
    )]
    pub reverse_entry: Account<'info, ReverseEntry>,
    #[account(constraint =
        certificate.mint == entry.mint
        && certificate.issuer == namespace.key()
        && certificate.state == cardinal_certificate::state::CertificateState::Invalidated as u8
        @ ErrorCode::InvalidCertificate
    )]
    pub certificate: Account<'info, cardinal_certificate::state::Certificate>,
    pub invalidator: Signer<'info>,
}

pub fn handler(ctx: Context<InvalidateUnmanagedReverseEntryCtx>) -> ProgramResult {
    let entry = &mut ctx.accounts.entry;
    entry.reverse_entry = None;
    Ok(())
}
