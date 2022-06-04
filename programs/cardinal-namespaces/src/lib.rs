pub mod errors;
mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w");

#[program]
pub mod namespaces {
    use super::*;

    pub fn init(ctx: Context<InitializeGlobalNamespaceCtx>, ix: InitializeGlobalNamespaceIx) -> ProgramResult {
        init_global_namespace::handler(ctx, ix)
    }

    pub fn set_rent_percentage(ctx: Context<UpdateGlobalNamespaceCtx>, rent_percentage: u64) -> ProgramResult {
        update_global_namespace::handler(ctx, rent_percentage)
    }

    pub fn transfer_global_update_authority(ctx: Context<SetGlobalNamespaceUpdateAuthorityCtx>, update_authority: Pubkey) -> ProgramResult {
        set_global_update_authority::handler(ctx, update_authority)
    }

    pub fn transfer_global_rent_authority(ctx: Context<SetGlobalNamespaceRentAuthorityCtx>, rent_authority: Pubkey) -> ProgramResult {
        set_global_rent_authority::handler(ctx, rent_authority)
    }

    pub fn create_namespace(ctx: Context<CreateNamespace>, ix: CreateNamespaceIx) -> ProgramResult {
        create_namespace::handler(ctx, ix)
    }

    pub fn update_namespace(ctx: Context<UpdateNamepsace>, ix: UpdateNamespaceIx) -> ProgramResult {
        update_namespace::handler(ctx, ix)
    }

    pub fn collect_namespace_funds(ctx: Context<CollectNamespaceFundsCtx>, amount: u64) -> ProgramResult {
        collect_namespace_funds::handler(ctx, amount)
    }

    pub fn collect_global_funds(ctx: Context<CollectGlobalFundsCtx>, amount: u64) -> ProgramResult {
        collect_global_funds::handler(ctx, amount)
    }

    pub fn init_entry(ctx: Context<InitEntry>, ix: InitEntryIx) -> ProgramResult {
        init_entry::handler(ctx, ix)
    }

    pub fn claim_entry(ctx: Context<ClaimEntry>, ix: ClaimEntryIx) -> ProgramResult {
        claim_entry::handler(ctx, ix)
    }

    pub fn set_entry_data(ctx: Context<SetEntryData>, data: Pubkey) -> ProgramResult {
        set_entry_data::handler(ctx, data)
    }

    pub fn set_reverse_entry(ctx: Context<SetReverseEntryCtx>, reverse_entry_bump: u8) -> ProgramResult {
        set_reverse_entry::handler(ctx, reverse_entry_bump)
    }

    pub fn revoke_entry(ctx: Context<RevokeEntryCtx>) -> ProgramResult {
        revoke_entry::handler(ctx)
    }

    pub fn revoke_reverse_entry(ctx: Context<RevokeReverseEntryCtx>) -> ProgramResult {
        revoke_reverse_entry::handler(ctx)
    }

    pub fn invalidate_managed_entry(ctx: Context<InvalidateManagedEntryCtx>) -> ProgramResult {
        invalidate_managed_entry::handler(ctx)
    }

    pub fn invalidate_managed_reverse_entry(ctx: Context<InvalidateManagedReverseEntryCtx>) -> ProgramResult {
        invalidate_managed_reverse_entry::handler(ctx)
    }

    pub fn invalidate_unmanaged_entry(ctx: Context<InvalidateUnmanagedEntryCtx>) -> ProgramResult {
        invalidate_unmanaged_entry::handler(ctx)
    }

    pub fn invalidate_unmanaged_reverse_entry(ctx: Context<InvalidateUnmanagedReverseEntryCtx>) -> ProgramResult {
        invalidate_unmanaged_reverse_entry::handler(ctx)
    }

    pub fn create_claim_request(ctx: Context<CreateClaimRequestCtx>, entry_name: String, claim_request_bump: u8, user: Pubkey) -> ProgramResult {
        create_claim_request::handler(ctx, entry_name, claim_request_bump, user)
    }

    pub fn update_claim_request(ctx: Context<UpdateClaimRequestCtx>, is_approved: bool) -> ProgramResult {
        update_claim_request::handler(ctx, is_approved)
    }

    pub fn update_entry_mint_metadata(ctx: Context<UpdateEntryMintMetadataCtx>, args: UpdateMetadataArgs) -> ProgramResult {
        update_entry_mint_metadata::handler(ctx, args)
    }
}
