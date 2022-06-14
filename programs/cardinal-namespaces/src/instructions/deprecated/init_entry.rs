use {
    crate::state::*,
    anchor_lang::{prelude::*, solana_program::program::invoke_signed},
    anchor_spl::{
        associated_token::{self, AssociatedToken},
        token::{self, Token},
    },
    cardinal_certificate::{self, cpi::accounts::CreateMintManagerCtx, program::CardinalCertificate},
    mpl_token_metadata::{instruction::create_metadata_accounts, state::Creator as MCreator},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitEntryIx {
    pub name: String,
    pub entry_bump: u8,
    pub mint_manager_bump: u8,
}

#[derive(Accounts)]
#[instruction(ix: InitEntryIx)]
pub struct InitEntry<'info> {
    namespace: Box<Account<'info, Namespace>>,
    #[account(
        init,
        payer = payer,
        // todo choose size once data is finalized
        space = ENTRY_SIZE,
        seeds = [ENTRY_SEED.as_bytes(), namespace.key().as_ref(), ix.name.as_bytes()],
        bump,
    )]
    entry: Account<'info, Entry>,
    #[account(mut)]
    payer: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    namespace_certificate_token_account: UncheckedAccount<'info>,

    // cpi accounts
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    certificate_mint: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    certificate_mint_metadata: UncheckedAccount<'info>,

    // programs
    certificate_program: Program<'info, CardinalCertificate>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    token_metadata_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    associated_token: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitEntry>, ix: InitEntryIx) -> Result<()> {
    let entry = &mut ctx.accounts.entry;
    entry.namespace = ctx.accounts.namespace.key();
    entry.name = ix.name.clone();
    entry.bump = *ctx.bumps.get("entry").unwrap();
    entry.data = None;
    entry.mint = ctx.accounts.certificate_mint.key();
    entry.is_claimed = false;

    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    // initialize certificate mint
    let cpi_accounts = token::InitializeMint {
        mint: ctx.accounts.certificate_mint.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::initialize_mint(cpi_context, 0, &ctx.accounts.namespace.key(), Some(&ctx.accounts.namespace.key()))?;

    // create metadata
    invoke_signed(
        &create_metadata_accounts(
            *ctx.accounts.token_metadata_program.key,
            *ctx.accounts.certificate_mint_metadata.key,
            *ctx.accounts.certificate_mint.key,
            ctx.accounts.namespace.key(),
            *ctx.accounts.payer.key,
            ctx.accounts.namespace.key(),
            ctx.accounts.namespace.name.clone(),
            "NAME".to_string(),
            // generative URL which will inclde image of the name with expiration data
            "https://nft.cardinal.so/metadata/".to_string() + &ctx.accounts.certificate_mint.key().to_string() + &"?name=".to_string() + &ctx.accounts.entry.name.to_string(),
            Some(vec![MCreator {
                address: ctx.accounts.namespace.key(),
                verified: true,
                share: 100,
            }]),
            0,
            true,
            true,
        ),
        &[
            ctx.accounts.certificate_mint_metadata.to_account_info(),
            ctx.accounts.certificate_mint.to_account_info(),
            ctx.accounts.namespace.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.namespace.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        namespace_signer,
    )?;

    // create associated certificate token account for namespace
    let cpi_accounts = associated_token::Create {
        payer: ctx.accounts.payer.to_account_info(),
        associated_token: ctx.accounts.namespace_certificate_token_account.to_account_info(),
        authority: ctx.accounts.namespace.to_account_info(),
        mint: ctx.accounts.certificate_mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    associated_token::create(cpi_context)?;

    // mint single token to namespace token account
    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.certificate_mint.to_account_info(),
        to: ctx.accounts.namespace_certificate_token_account.to_account_info(),
        authority: ctx.accounts.namespace.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(namespace_signer);
    token::mint_to(cpi_context, 1)?;

    // init certificate mint manager
    let certificate_program = ctx.accounts.certificate_program.to_account_info();
    let cpi_accounts = CreateMintManagerCtx {
        mint_manager: ctx.accounts.mint_manager.to_account_info(),
        mint: ctx.accounts.certificate_mint.to_account_info(),
        freeze_authority: ctx.accounts.namespace.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(certificate_program, cpi_accounts).with_signer(namespace_signer);
    cardinal_certificate::cpi::create_mint_manager(cpi_ctx, ix.mint_manager_bump)?;
    Ok(())
}
