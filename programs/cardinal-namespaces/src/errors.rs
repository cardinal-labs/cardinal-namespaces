use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Owner mint is invalid")]
    InvalidOwnerMint,
    #[msg("Entry has not expired")]
    EntryNotExpired,
    #[msg("Rental duration too small try adding more funds")]
    RentalDurationTooSmall,
    #[msg("Rental duration too large try adding less funds")]
    RentalDurationTooLarge,
    #[msg("Namespace requires duration")]
    NamespaceRequiresDuration,
    #[msg("Authority is invalid")]
    InvalidAuthority,
    #[msg("Invalid authorty token account")]
    InvalidAuthorityTokenAccount,
    #[msg("Invalid namespace payment account")]
    InvalidNamespacePaymentAccount,
    #[msg("Invalid global context payment account")]
    InvalidGlobalContextPaymentAccount,
    #[msg("Invalid namespace")]
    InvalidNamespace,
    #[msg("Invalid entry")]
    InvalidEntry,
    #[msg("Invalid payment mint")]
    InvalidPaymentMint,
    #[msg("Invalid reverse entry")]
    InvalidReverseEntry,
    #[msg("Claim not allowed")]
    ClaimNotAllowed,
    #[msg("Invalid approve authority")]
    InvalidApproveAuthority,
    #[msg("Namespace requires token")]
    NamespaceRequiresToken,
    #[msg("Mint already initialized")]
    MintAlreadyInitialized,
    #[msg("Mint invalid for entry")]
    InvalidEntryMint,
    #[msg("Time invalidator program ID is invalid")]
    InvalidTimeInvalidatorProgramId,
    #[msg("Invalid token manager")]
    InvalidTokenManager,
    #[msg("Name Entry already claimed")]
    NameEntryAlreadyClaimed,
    #[msg("Invalid certificate")]
    InvalidCertificate,
}
