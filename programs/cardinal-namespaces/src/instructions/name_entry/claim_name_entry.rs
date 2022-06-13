use anchor_spl::token::Mint;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{self, AssociatedToken},
        token::Token,
    },
    cardinal_time_invalidator::{self},
    cardinal_token_manager::{
        self,
        program::CardinalTokenManager,
        state::{InvalidationType, TokenManagerKind},
    },
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ClaimNameEntryIx {
    pub duration: Option<i64>,
}

#[derive(Accounts)]
#[instruction(ix: ClaimNameEntryIx)]
pub struct ClaimNameEntryCtx<'info> {
    #[account(mut)]
    namespace: Box<Account<'info, Namespace>>,
    #[account(mut, constraint = name_entry.namespace == namespace.key() @ ErrorCode::InvalidNamespace)]
    name_entry: Box<Account<'info, Entry>>,
    #[account(mut)]
    requestor: Signer<'info>,
    #[account(mut)]
    recipient: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account(mut,
        close = namespace,
        constraint = claim_request.is_approved
        && claim_request.namespace == namespace.key()
        && claim_request.entry_name == name_entry.name
        && claim_request.requestor == requestor.key()
        && claim_request.counter == name_entry.claim_request_counter
        @ ErrorCode::ClaimNotAllowed
    )]
    claim_request: Box<Account<'info, ClaimRequest>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, constraint = mint.key() == name_entry.mint @ ErrorCode::InvalidEntryMint)]
    mint: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    namespace_token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    token_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    token_manager_token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint_counter: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    recipient_token_account: UncheckedAccount<'info>,

    // programs
    token_manager_program: Program<'info, CardinalTokenManager>,
    token_program: Program<'info, Token>,
    associated_token: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, ClaimNameEntryCtx<'info>>, ix: ClaimNameEntryIx) -> Result<()> {
    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let name_entry = &mut ctx.accounts.name_entry;
    name_entry.data = Some(ctx.accounts.recipient.key());
    name_entry.claim_request_counter = name_entry.claim_request_counter.checked_add(1).expect("Add error");

    if name_entry.is_claimed {
        return Err(error!(ErrorCode::NameEntryAlreadyClaimed));
    }
    name_entry.is_claimed = true;

    // duration checks
    if ix.duration != None {
        if ix.duration.unwrap() <= ctx.accounts.namespace.min_rental_seconds {
            return Err(error!(ErrorCode::RentalDurationTooSmall));
        }
        if ctx.accounts.namespace.max_rental_seconds != None && ix.duration.unwrap() >= ctx.accounts.namespace.max_rental_seconds.unwrap() {
            return Err(error!(ErrorCode::RentalDurationTooLarge));
        }
    } else if ctx.accounts.namespace.max_rental_seconds != None {
        return Err(error!(ErrorCode::NamespaceRequiresDuration));
    }

    let namespace_seeds = &[NAMESPACE_PREFIX.as_bytes(), ctx.accounts.namespace.name.as_bytes(), &[ctx.accounts.namespace.bump]];
    let namespace_signer = &[&namespace_seeds[..]];

    if ctx.accounts.token_manager_token_account.data_is_empty() {
        // create associated token account for certificate mint
        let cpi_accounts = associated_token::Create {
            payer: ctx.accounts.payer.to_account_info(),
            associated_token: ctx.accounts.token_manager_token_account.to_account_info(),
            authority: ctx.accounts.token_manager.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        associated_token::create(cpi_context)?;
    }

    // token manager init
    let init_ix = cardinal_token_manager::instructions::InitIx {
        amount: 1,
        kind: if ctx.accounts.namespace.transferable_entries {
            TokenManagerKind::Unmanaged as u8
        } else {
            TokenManagerKind::Edition as u8
        },
        invalidation_type: if ctx.accounts.namespace.transferable_entries {
            InvalidationType::Invalidate as u8
        } else {
            InvalidationType::Return as u8
        },
        num_invalidators: if ctx.accounts.namespace.payment_amount_daily > 0 { 2 } else { 1 },
    };
    let cpi_accounts = cardinal_token_manager::cpi::accounts::InitCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        mint_counter: ctx.accounts.mint_counter.to_account_info(),
        issuer: ctx.accounts.namespace.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        issuer_token_account: ctx.accounts.namespace_token_account.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(namespace_signer);
    cardinal_token_manager::cpi::init(cpi_ctx, init_ix)?;

    // add invalidator
    let cpi_accounts = cardinal_token_manager::cpi::accounts::AddInvalidatorCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        issuer: ctx.accounts.namespace.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(namespace_signer);
    cardinal_token_manager::cpi::add_invalidator(cpi_ctx, ctx.accounts.namespace.key())?;

    let mut payment_manager_account_info: Option<&AccountInfo> = None;
    let mut time_invalidator_account_info: Option<&AccountInfo> = None;
    let mut time_invalidator_program: Option<&AccountInfo> = None;
    if ctx.accounts.namespace.payment_amount_daily > 0 {
        // payment_mint
        let payment_mint_account_info = next_account_info(remaining_accs)?;
        let payment_mint = Account::<Mint>::try_from(payment_mint_account_info)?;
        if payment_mint.key() != ctx.accounts.namespace.payment_mint {
            return Err(error!(ErrorCode::InvalidPaymentMint));
        }
        payment_manager_account_info = Some(next_account_info(remaining_accs)?);
        time_invalidator_account_info = Some(next_account_info(remaining_accs)?);
        time_invalidator_program = Some(next_account_info(remaining_accs)?);
        if time_invalidator_program.expect("Expected time_invalidator_program").key() != cardinal_time_invalidator::id() {
            return Err(error!(ErrorCode::InvalidTimeInvalidatorProgramId));
        }

        // init time invalidator
        let init_ix = cardinal_time_invalidator::instructions::InitIx {
            collector: ctx.accounts.namespace.key(),
            payment_manager: payment_manager_account_info.expect("Expected payment_manager").key(),
            duration_seconds: Some(0),
            extension_payment_amount: Some(ctx.accounts.namespace.payment_amount_daily),
            extension_duration_seconds: Some(86400),
            extension_payment_mint: Some(payment_mint.key()),
            max_expiration: None,
            disable_partial_extension: None,
        };
        let cpi_accounts = cardinal_time_invalidator::cpi::accounts::InitCtx {
            token_manager: ctx.accounts.token_manager.to_account_info(),
            issuer: ctx.accounts.namespace.to_account_info(),
            payer: ctx.accounts.payer.to_account_info(),
            time_invalidator: time_invalidator_account_info.expect("Expected time_invalidator_account_info").to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(time_invalidator_program.unwrap().to_account_info(), cpi_accounts).with_signer(namespace_signer);
        cardinal_time_invalidator::cpi::init(cpi_ctx, init_ix)?;

        //add time invalidator
        let cpi_accounts = cardinal_token_manager::cpi::accounts::AddInvalidatorCtx {
            token_manager: ctx.accounts.token_manager.to_account_info(),
            issuer: ctx.accounts.namespace.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(namespace_signer);
        cardinal_token_manager::cpi::add_invalidator(cpi_ctx, ctx.accounts.namespace.key())?;
    }

    // token manager issue
    let cpi_accounts = cardinal_token_manager::cpi::accounts::IssueCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        token_manager_token_account: ctx.accounts.token_manager_token_account.to_account_info(),
        issuer: ctx.accounts.namespace.to_account_info(),
        issuer_token_account: ctx.accounts.namespace_token_account.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(namespace_signer);
    cardinal_token_manager::cpi::issue(cpi_ctx)?;

    // token manager claim
    let cpi_accounts = cardinal_token_manager::cpi::accounts::ClaimCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        token_manager_token_account: ctx.accounts.token_manager_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        recipient: ctx.accounts.recipient.to_account_info(),
        recipient_token_account: ctx.accounts.recipient_token_account.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let remaining_accounts = ctx.remaining_accounts.to_vec();
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_remaining_accounts(remaining_accounts);
    cardinal_token_manager::cpi::claim(cpi_ctx)?;

    if ctx.accounts.namespace.payment_amount_daily > 0 && ix.duration.expect("Duration required") > 0 {
        let payer_token_account_info = next_account_info(remaining_accs)?;
        let payment_token_account = next_account_info(remaining_accs)?;
        let fee_collector_token_account = next_account_info(remaining_accs)?;
        let payment_manager_program = next_account_info(remaining_accs)?;

        let cpi_accounts = cardinal_time_invalidator::cpi::accounts::ExtendExpirationCtx {
            token_manager: ctx.accounts.token_manager.to_account_info(),
            time_invalidator: time_invalidator_account_info.expect("Expected time_invalidator").to_account_info(),
            payer: ctx.accounts.payer.to_account_info(),
            payment_manager: payment_manager_account_info.expect("Expected payment_manager").to_account_info(),
            payment_token_account: payment_token_account.to_account_info(),
            fee_collector_token_account: fee_collector_token_account.to_account_info(),
            payer_token_account: payer_token_account_info.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            cardinal_payment_manager: payment_manager_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(time_invalidator_program.expect("Expected time_invalidator_program").to_account_info(), cpi_accounts).with_signer(namespace_signer);
        cardinal_time_invalidator::cpi::extend_expiration(cpi_ctx, ix.duration.expect("Duration required").try_into().expect("Duration invalid"))?;
    }
    Ok(())
}
