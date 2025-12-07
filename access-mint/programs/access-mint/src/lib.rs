use anchor_lang::prelude::*;

declare_id!("FmqUGBhdGHK9iPWbweoBXFBU2BY9g6C5ncfQstbXpDf6");

#[program]
pub mod access_mint {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
