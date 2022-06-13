pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w");

#[program]
pub mod namespaces {
    use super::*;

    pub fn init(ctx: Context<InitGlobalContextCtx>, ix: InitGlobalContextIx) -> Result<()> {
        context::init_global_context::handler(ctx, ix)
    }

    pub fn update_global_context(ctx: Context<UpdateGlobalContextCtx>, ix: UpdateGlobalContextIx) -> Result<()> {
        context::update_global_context::handler(ctx, ix)
    }

    pub fn create_namespace(ctx: Context<CreateNamespace>, ix: CreateNamespaceIx) -> Result<()> {
        namespace::create_namespace::handler(ctx, ix)
    }

    pub fn update_namespace(ctx: Context<UpdateNamepsace>, ix: UpdateNamespaceIx) -> Result<()> {
        namespace::update_namespace::handler(ctx, ix)
    }

    pub fn collect_namespace_funds(ctx: Context<CollectNamespaceFundsCtx>, amount: u64) -> Result<()> {
        namespace::collect_namespace_funds::handler(ctx, amount)
    }

    pub fn revoke_reverse_entry(ctx: Context<RevokeReverseEntryCtx>) -> Result<()> {
        revoke_reverse_entry::handler(ctx)
    }

    pub fn set_namespace_reverse_entry(ctx: Context<SetNamespaceReverseEntryCtx>) -> Result<()> {
        set_namespace_reverse_entry::handler(ctx)
    }

    pub fn invalidate_managed_entry(ctx: Context<InvalidateManagedEntryCtx>) -> Result<()> {
        invalidate_managed_entry::handler(ctx)
    }

    pub fn invalidate_managed_reverse_entry(ctx: Context<InvalidateManagedReverseEntryCtx>) -> Result<()> {
        invalidate_managed_reverse_entry::handler(ctx)
    }

    pub fn invalidate_unmanaged_entry(ctx: Context<InvalidateUnmanagedEntryCtx>) -> Result<()> {
        invalidate_unmanaged_entry::handler(ctx)
    }

    pub fn invalidate_unmanaged_reverse_entry(ctx: Context<InvalidateUnmanagedReverseEntryCtx>) -> Result<()> {
        invalidate_unmanaged_reverse_entry::handler(ctx)
    }

    pub fn claim_entry_v2<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, ClaimEntryV2Ctx<'info>>, ix: ClaimEntryV2Ix) -> Result<()> {
        claim_entry_v2::handler(ctx, ix)
    }

    pub fn invalidate_entry<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, InvalidateEntryCtx<'info>>) -> Result<()> {
        invalidate_entry::handler(ctx)
    }

    pub fn create_claim_request(ctx: Context<CreateClaimRequestCtx>, entry_name: String, user: Pubkey) -> Result<()> {
        requests::create_claim_request::handler(ctx, entry_name, user)
    }

    pub fn update_claim_request(ctx: Context<UpdateClaimRequestCtx>, is_approved: bool) -> Result<()> {
        requests::update_claim_request::handler(ctx, is_approved)
    }

    pub fn update_entry_mint_metadata(ctx: Context<UpdateEntryMintMetadataCtx>, args: UpdateEntryMintMetadataIx) -> Result<()> {
        update_entry_mint_metadata::handler(ctx, args)
    }

    pub fn set_entry_data_v2(ctx: Context<SetEntryDataV2Ctx>) -> Result<()> {
        set_entry_data_v2::handler(ctx)
    }

    // deprecated
    pub fn init_entry(ctx: Context<InitEntry>, ix: InitEntryIx) -> Result<()> {
        deprecated::init_entry::handler(ctx, ix)
    }

    pub fn claim_entry(ctx: Context<ClaimEntry>, ix: ClaimEntryIx) -> Result<()> {
        deprecated::claim_entry::handler(ctx, ix)
    }

    pub fn set_entry_data(ctx: Context<SetEntryData>, data: Pubkey) -> Result<()> {
        deprecated::set_entry_data::handler(ctx, data)
    }

    pub fn set_reverse_entry(ctx: Context<SetReverseEntryCtx>, reverse_entry_bump: u8) -> Result<()> {
        deprecated::set_reverse_entry::handler(ctx, reverse_entry_bump)
    }

    pub fn revoke_entry(ctx: Context<RevokeEntryCtx>) -> Result<()> {
        deprecated::revoke_entry::handler(ctx)
    }
}
