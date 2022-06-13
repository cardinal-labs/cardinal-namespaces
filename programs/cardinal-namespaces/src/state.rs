use anchor_lang::prelude::*;

pub const GLOBAL_CONTEXT_PREFIX: &str = "context";
pub const NAMESPACE_PREFIX: &str = "namespace";
pub const ENTRY_SEED: &str = "entry";
pub const REVERSE_ENTRY_SEED: &str = "reverse-entry";
pub const CLAIM_REQUEST_SEED: &str = "rent-request";

pub const GLOBAL_CONTEXT_SIZE: usize = 8 + std::mem::size_of::<GlobalContext>() + 24;
pub const BASIS_POINTS_DIVISOR: u16 = 10000;
#[account]
pub struct GlobalContext {
    pub bump: u8,
    pub update_authority: Pubkey,
    pub rent_authority: Pubkey,
    pub fee_basis_points: u64,
}

pub const NAMESPACE_SIZE: usize = 8 + std::mem::size_of::<Namespace>() + 80;
#[account]
pub struct Namespace {
    pub bump: u8,
    pub name: String,
    pub update_authority: Pubkey,
    pub rent_authority: Pubkey,
    pub approve_authority: Option<Pubkey>,
    pub schema: u8,
    // payment
    pub payment_amount_daily: u64,
    pub payment_mint: Pubkey,
    // validators
    pub min_rental_seconds: i64,
    pub max_rental_seconds: Option<i64>,
    pub transferable_entries: bool,
}

pub const CLAIM_REQUEST_SIZE: usize = 8 + std::mem::size_of::<ClaimRequest>() + 24;
#[account]
pub struct ClaimRequest {
    pub bump: u8,
    pub requestor: Pubkey,
    pub is_approved: bool,
    pub namespace: Pubkey,
    pub entry_name: String,
    pub counter: u32,
}

pub const ENTRY_SIZE: usize = 8 + std::mem::size_of::<Entry>() + 24;
#[account]
pub struct Entry {
    pub bump: u8,
    pub namespace: Pubkey,
    pub name: String,
    pub data: Option<Pubkey>,
    pub reverse_entry: Option<Pubkey>,
    pub mint: Pubkey,
    pub is_claimed: bool,
    pub claim_request_counter: u32,
}

pub const REVERSE_ENTRY_SIZE: usize = 8 + std::mem::size_of::<ReverseEntry>() + 24 + 24;
#[account]
pub struct ReverseEntry {
    pub bump: u8,
    pub entry_name: String,
    pub namespace_name: String,
}
