use anchor_lang::AccountsClose;
use anchor_spl::token::TokenAccount;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InvalidateExpiredNameEntryCtx<'info> {
    #[account(mut)]
    pub namespace: Account<'info, Namespace>,
    // Must invalidate reverse entry first
    #[account(mut, constraint = name_entry.namespace == namespace.key() @ ErrorCode::InvalidEntry)]
    pub name_entry: Account<'info, Entry>,
    #[account(mut, constraint =
        namespace_token_account.mint == name_entry.mint
        && namespace_token_account.owner == namespace.key()
        && namespace_token_account.amount > 0
        @ ErrorCode::NamespaceRequiresToken
    )]
    pub namespace_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    invalidator: UncheckedAccount<'info>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, InvalidateExpiredNameEntryCtx<'info>>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.data = None;
    name_entry.is_claimed = false;

    // check reverse entry
    if name_entry.reverse_entry.is_some() {
        let remaining_accs = &mut ctx.remaining_accounts.iter();
        let reverse_entry_info = next_account_info(remaining_accs)?;
        let reverse_entry = Account::<ReverseEntry>::try_from(reverse_entry_info)?;

        if reverse_entry.entry_name == name_entry.name {
            reverse_entry.close(ctx.accounts.invalidator.to_account_info())?;
        }
    }

    name_entry.reverse_entry = None;
    let namespace = &mut ctx.accounts.namespace;
    namespace.count = namespace.count.checked_sub(1).expect("Sub error");
    Ok(())
}
