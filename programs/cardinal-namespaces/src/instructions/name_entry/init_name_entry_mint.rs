use anchor_lang::solana_program::program::invoke;
use mpl_token_metadata::instruction::{create_master_edition_v3, create_metadata_accounts_v2};

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::{prelude::*, solana_program::program::invoke_signed, solana_program::program_pack::Pack},
    anchor_spl::{
        associated_token::{self, AssociatedToken},
        token::{self, Token},
    },
    mpl_token_metadata::state::Creator as MCreator,
    spl_token::solana_program::system_instruction,
};
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    pub share: u8,
}

#[derive(Accounts)]
pub struct InitNameEntryMintCtx<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(mut, constraint = name_entry.mint == Pubkey::default() @ ErrorCode::MintAlreadyInitialized)]
    name_entry: Account<'info, Entry>,
    #[account(mut)]
    payer: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    namespace_token_account: UncheckedAccount<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint_metadata: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    master_edition: UncheckedAccount<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(address = mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    associated_token: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitNameEntryMintCtx>) -> Result<()> {
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.namespace = ctx.accounts.namespace.key();
    name_entry.mint = ctx.accounts.mint.key();

    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    // create account for mint
    invoke(
        &system_instruction::create_account(
            ctx.accounts.payer.key,
            ctx.accounts.mint.key,
            ctx.accounts.rent.minimum_balance(spl_token::state::Mint::LEN),
            spl_token::state::Mint::LEN as u64,
            &spl_token::id(),
        ),
        &[ctx.accounts.payer.to_account_info(), ctx.accounts.mint.to_account_info()],
    )?;

    // initialize mint
    let cpi_accounts = token::InitializeMint {
        mint: ctx.accounts.mint.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::initialize_mint(cpi_context, 0, &ctx.accounts.namespace.key(), Some(&ctx.accounts.namespace.key()))?;

    // create metadata
    invoke_signed(
        &create_metadata_accounts_v2(
            *ctx.accounts.token_metadata_program.key,
            *ctx.accounts.mint_metadata.key,
            *ctx.accounts.mint.key,
            ctx.accounts.namespace.key(),
            *ctx.accounts.payer.key,
            ctx.accounts.namespace.key(),
            ctx.accounts.namespace.name.clone(),
            "NAME".to_string(),
            // generative URL which will inclde image of the name with expiration data
            "https://nft.cardinal.so/metadata/".to_string() + &ctx.accounts.mint.key().to_string() + &"?name=".to_string() + &ctx.accounts.name_entry.name.to_string(),
            Some(vec![MCreator {
                address: ctx.accounts.namespace.key(),
                verified: true,
                share: 100,
            }]),
            0,
            true,
            true,
            None,
            None,
        ),
        &[
            ctx.accounts.mint_metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.namespace.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.namespace.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        namespace_signer,
    )?;

    // create associated token account for namespace
    let cpi_accounts = associated_token::Create {
        payer: ctx.accounts.payer.to_account_info(),
        associated_token: ctx.accounts.namespace_token_account.to_account_info(),
        authority: ctx.accounts.namespace.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    associated_token::create(cpi_context)?;

    // mint single token to namespace token account
    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.namespace_token_account.to_account_info(),
        authority: ctx.accounts.namespace.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(namespace_signer);
    token::mint_to(cpi_context, 1)?;

    // create master edition
    invoke_signed(
        &create_master_edition_v3(
            *ctx.accounts.token_metadata_program.key,
            *ctx.accounts.master_edition.key,
            *ctx.accounts.mint.key,
            ctx.accounts.namespace.key(),
            ctx.accounts.namespace.key(),
            ctx.accounts.mint_metadata.key(),
            ctx.accounts.payer.key(),
            Some(0),
        ),
        &[
            ctx.accounts.master_edition.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.namespace.to_account_info(),
            ctx.accounts.namespace.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.mint_metadata.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        namespace_signer,
    )?;

    Ok(())
}
