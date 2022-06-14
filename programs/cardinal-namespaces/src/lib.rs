pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w");

#[program]
pub mod namespaces {
    use super::*;

    // global context
    pub fn collect_global_context_funds(ctx: Context<CollectGlobalContextFunds>, amount: u64) -> Result<()> {
        global_context::collect_global_context_funds::handler(ctx, amount)
    }

    pub fn init_global_context(ctx: Context<InitGlobalContextCtx>, ix: InitGlobalContextIx) -> Result<()> {
        global_context::init_global_context::handler(ctx, ix)
    }

    pub fn update_global_context(ctx: Context<UpdateGlobalContextCtx>, ix: UpdateGlobalContextIx) -> Result<()> {
        global_context::update_global_context::handler(ctx, ix)
    }

    // name entry
    pub fn claim_name_entry<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, ClaimNameEntryCtx<'info>>, ix: ClaimNameEntryIx) -> Result<()> {
        name_entry::claim_name_entry::handler(ctx, ix)
    }

    pub fn init_name_entry_mint(ctx: Context<InitNameEntryMintCtx>) -> Result<()> {
        name_entry::init_name_entry_mint::handler(ctx)
    }

    pub fn init_name_entry(ctx: Context<InitNameEntryCtx>, ix: InitNameEntryIx) -> Result<()> {
        name_entry::init_name_entry::handler(ctx, ix)
    }

    pub fn invalidate_expired_name_entry(ctx: Context<InvalidateExpiredNameEntryCtx>) -> Result<()> {
        name_entry::invalidate_expired_name_entry::handler(ctx)
    }

    pub fn invalidate_transferable_name_entry(ctx: Context<InvalidateTransferableNameEntryCtx>) -> Result<()> {
        name_entry::invalidate_transferable_name_entry::handler(ctx)
    }

    pub fn revoke_name_entry<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, RevokeNameEntryCtx<'info>>) -> Result<()> {
        name_entry::revoke_name_entry::handler(ctx)
    }

    pub fn set_name_entry_data(ctx: Context<SetEntryDataV2Ctx>) -> Result<()> {
        name_entry::set_name_entry_data::handler(ctx)
    }

    pub fn update_name_entry_mint_metadata(ctx: Context<UpdateNameEntryMintMetadataCtx>, ix: UpdateNameEntryMintMetadataIx) -> Result<()> {
        name_entry::update_name_entry_mint_metadata::handler(ctx, ix)
    }

    // namespace
    pub fn collect_namespace_funds(ctx: Context<CollectNamespaceFundsCtx>, amount: u64) -> Result<()> {
        namespace::collect_namespace_funds::handler(ctx, amount)
    }

    pub fn create_namespace(ctx: Context<CreateNamespace>, ix: CreateNamespaceIx) -> Result<()> {
        namespace::create_namespace::handler(ctx, ix)
    }

    pub fn update_namespace(ctx: Context<UpdateNamepsace>, ix: UpdateNamespaceIx) -> Result<()> {
        namespace::update_namespace::handler(ctx, ix)
    }

    // requests
    pub fn create_claim_request(ctx: Context<CreateClaimRequestCtx>, entry_name: String, claim_request_bump: u8, user: Pubkey) -> Result<()> {
        requests::create_claim_request::handler(ctx, entry_name, claim_request_bump, user)
    }

    pub fn update_claim_request(ctx: Context<UpdateClaimRequestCtx>, is_approved: bool) -> Result<()> {
        requests::update_claim_request::handler(ctx, is_approved)
    }

    // reverse name entry
    pub fn invalidate_expired_reverse_entry(ctx: Context<InvalidateExpiredReverseNameEntryCtx>) -> Result<()> {
        reverse_name_entry::invalidate_expired_reverse_name_entry::handler(ctx)
    }

    pub fn invalidate_transferable_reverse_entry(ctx: Context<InvalidateTransferableReverseNameEntryCtx>) -> Result<()> {
        reverse_name_entry::invalidate_transferable_reverse_name_entry::handler(ctx)
    }

    pub fn revoke_reverse_entry(ctx: Context<RevokeReverseNameEntryCtx>) -> Result<()> {
        reverse_name_entry::revoke_reverse_name_entry::handler(ctx)
    }

    pub fn set_namespace_reverse_entry(ctx: Context<SetNamespaceReverseNameEntryCtx>) -> Result<()> {
        reverse_name_entry::set_namespace_reverse_name_entry::handler(ctx)
    }

    // deprecated
    #[deprecated]
    pub fn init_entry(ctx: Context<InitEntry>, ix: InitEntryIx) -> Result<()> {
        deprecated::init_entry::handler(ctx, ix)
    }

    #[deprecated]
    pub fn claim_entry(ctx: Context<ClaimEntry>, ix: ClaimEntryIx) -> Result<()> {
        deprecated::claim_entry::handler(ctx, ix)
    }

    #[deprecated]
    pub fn set_entry_data(ctx: Context<SetEntryData>, data: Pubkey) -> Result<()> {
        deprecated::set_entry_data::handler(ctx, data)
    }

    #[deprecated]
    pub fn set_reverse_entry(ctx: Context<SetReverseEntryCtx>, reverse_entry_bump: u8) -> Result<()> {
        deprecated::set_reverse_entry::handler(ctx, reverse_entry_bump)
    }

    #[deprecated]
    pub fn revoke_entry(ctx: Context<RevokeEntryCtx>) -> Result<()> {
        deprecated::revoke_entry::handler(ctx)
    }
}
