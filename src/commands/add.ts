import * as Discord from 'discord.js';
import { getTicker } from '../utility/fetch';

import { COLLECTIONS } from '../enums/collections';
import { IPortfolio } from '../interfaces/IPortfolio';
import { registerCommand } from '../service/commands';
import { getDatabase } from '../utility/database';

// import { getTicker } from '../utility/fetch';

registerCommand({ name: 'add', command, description: '<ticker> <amount> - Add to your portfolio.' });

async function command(msg: Discord.Message, ticker: string, amount: any) {
    const db = await getDatabase();

    if (!ticker) {
        msg.reply('Must supply a ticker.');
        return;
    }

    ticker = ticker.toLowerCase();
    const isTicker = await getTicker(ticker);
    if (!isTicker) {
        msg.reply(`$${ticker} is not a valid ticker.`);
        return;
    }

   

    amount = parseFloat(amount);

    if (!amount || amount <= 0) {
        msg.reply(`Must use a positive value.`);
        return;
    }

    if (amount > Number.MAX_SAFE_INTEGER - 500000) {
        msg.reply(`Number is too large.`);
        return;
    }

    const current_price = isTicker.usd;
    const current_value = current_price * amount;
    

    let data: IPortfolio = await db.fetchData('id', msg.author.id, COLLECTIONS.CRYPTO);
    if (!data) {
        data = await db.insertData({ id: msg.author.id, portfolio: {}, addhistory:{} }, COLLECTIONS.CRYPTO, true);
    }

    if (data.portfolio[ticker]) {
        // data.portfolio[ticker] = 0;
        await msg.reply("Looks like you already have a coin listed in the portfolio. remove this first to add again")
        return
    }

    // Setup coin add History if Non Existant
    if (!data.addhistory[ticker]) {
        data.addhistory[ticker] = [];
    }

    data.portfolio[ticker] += amount;
    data.addhistory[ticker].push({amount: amount, price:current_price, value:current_value})

    await db.updatePartialData(data._id, { portfolio: data.portfolio, addhistory: data.addhistory }, COLLECTIONS.CRYPTO);

    if (data.privacy) {
        msg.author.send(`Added ${amount} to $${ticker.toUpperCase()} to your portfolio.`).catch((err) => {
            msg.reply(`Could not send you a private message. Open your DMs nerd.`);
        });
    } else {
        msg.reply(`Added ${amount} $${ticker.toUpperCase()} to your portfolio.`);
    }
    try{
        msg.delete();
    }catch{
        console.log("error deleting the command message")
    }
}
