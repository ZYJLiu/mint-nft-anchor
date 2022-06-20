use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{self, Mint, Token, MintTo, TokenAccount,};
use mpl_token_metadata::instruction::create_metadata_accounts_v2;

declare_id!("F6mQpwzq6MtV4GxPeVL9TU6PDpUNBwd3z6rxRP26Sf5p");

#[program]
pub mod token_rewards_nft {
    use super::*;

    pub fn create_nft_reward(
        ctx: Context<CreateNftReward>,
        reward_basis_points: u64,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        let (reward_mint, reward_bump) = Pubkey::find_program_address(
            &["MINT".as_bytes(), ctx.accounts.reward_data.key().as_ref()],
            ctx.program_id,
        );

        if reward_mint != ctx.accounts.reward_mint.key() {
            return err!(ErrorCode::PDA);
        }

        let token_data = &mut ctx.accounts.reward_data;
        token_data.user = ctx.accounts.user.key();
        token_data.reward_mint = ctx.accounts.reward_mint.key();
        token_data.reward_bump = reward_bump;
        token_data.reward_basis_points = reward_basis_points;

        msg!("Create Reward Token");

        let reward_data = ctx.accounts.reward_data.key();
        let seeds = &[
            "MINT".as_bytes(),
            reward_data.as_ref(),
            &[ctx.accounts.reward_data.reward_bump],
        ];
        let signer = [&seeds[..]];

        let account_info = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.reward_mint.to_account_info(),
            ctx.accounts.reward_mint.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];
        invoke_signed(
            &create_metadata_accounts_v2(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.reward_mint.key(),
                ctx.accounts.reward_mint.key(),
                ctx.accounts.user.key(),
                ctx.accounts.user.key(),
                name,
                symbol,
                uri,
                None,
                0,
                true,
                true,
                None,
                None,
            ),
            account_info.as_slice(),
            &signer,
        )?;

        Ok(())
    }

    pub fn mint_nft(
        ctx: Context<MintNFT>,
    ) -> Result<()> {
        let reward_data = ctx.accounts.reward_data.key();

        let seeds = &["MINT".as_bytes(), reward_data.as_ref(), &[ctx.accounts.reward_data.reward_bump]];
        let signer = [&seeds[..]];

        msg!("Minting NFT");
        let cpi_accounts = MintTo {
            mint: ctx.accounts.reward_mint.to_account_info(),
            to: ctx.accounts.customer_nft.to_account_info(),
            authority: ctx.accounts.reward_mint.to_account_info(),
        };
        msg!("CPI Accounts Assigned");
        let cpi_program = ctx.accounts.token_program.to_account_info();
        msg!("CPI Program Assigned");
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer);
        msg!("CPI Context Assigned");
        token::mint_to(cpi_ctx, 1)?;
        msg!("Token Minted !!!");

        Ok(())
    }

    pub fn update_nft_reward(ctx: Context<UpdateNftReward>, reward_basis_points: u64) -> Result<()> {
        
        let reward_data = &mut ctx.accounts.reward_data;
        
        reward_data.reward_basis_points = reward_basis_points;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateNftReward<'info>{
     #[account(
        init,
        seeds = ["DATA".as_bytes().as_ref(), user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + 32 + 32 + 1 + 8
    )]
    pub reward_data: Account<'info, TokenData>,

    #[account(
        init,
        seeds = ["MINT".as_bytes().as_ref(), reward_data.key().as_ref()],
        bump,
        payer = user,
        mint::decimals = 0,
        mint::authority = reward_mint, 
        
    )]
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,

    /// CHECK: 
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,

}


#[derive(Accounts)]
pub struct MintNFT<'info>{
    #[account(
        seeds = ["DATA".as_bytes().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub reward_data: Account<'info, TokenData>,

    #[account(mut,
        seeds = ["MINT".as_bytes().as_ref(), reward_data.key().as_ref()],
        bump = reward_data.reward_bump
    )]
    pub reward_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    
    //TODO: validate account
    /// CHECK:
    #[account(mut)]
    pub user: AccountInfo<'info>,

    #[account(mut,
        constraint = customer_nft.mint == reward_mint.key(),
        constraint = customer_nft.owner == customer.key() 
    )]
    pub customer_nft: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub customer: Signer<'info>,

}

#[derive(Accounts)]
pub struct UpdateNftReward<'info> {
    #[account(mut)]
    pub reward_data: Account<'info, TokenData>,

    #[account(
        constraint = reward_data.user == user.key()
    )]
    pub user: Signer<'info>,
}

#[account]
pub struct TokenData {
    pub user: Pubkey, // 32
    pub reward_mint: Pubkey, // 32
    pub reward_bump: u8, // 1
    pub reward_basis_points: u64 // 8

}

#[error_code]
pub enum ErrorCode {
    #[msg("PDA not match")]
    PDA
}
