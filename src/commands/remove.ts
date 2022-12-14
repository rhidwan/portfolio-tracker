import * as Discord from 'discord.js';
import { registerCommand } from '../service/commands';
import { COLLECTIONS } from '../enums/collections';
import { IPortfolio } from '../interfaces/IPortfolio';
import { getDatabase } from '../utility/database';
var path = require('path');
const fs = require('fs');

var config_file_path = path.resolve(__dirname, "../config/config.json");

registerCommand({
    name: 'remove',
    command,
    description: '<ticker> <amount> - Remove a token amount from your portfolio.',
});

async function command(msg: Discord.Message, ticker: string) {
    const db = await getDatabase();

    if (!ticker) {
        msg.reply('Must supply a ticker.');
        return;
    }
    let content = JSON.parse(fs.readFileSync(config_file_path, 'utf8'));
    if (content.freeze){
        msg.reply("Adding/removing is not allowed right now");
        return;
    }
    ticker = ticker.toLowerCase();
    // amount = parseFloat(amount);

    // if (!amount || amount <= 0) {
    //     msg.reply(`Must use a positive value.`);
    //     return;
    // }

    // if (amount > Number.MAX_SAFE_INTEGER - 500000) {
    //     msg.reply(`Number is too large.`);
    //     return;
    // }

    let data: IPortfolio = await db.fetchData('id', msg.author.id, COLLECTIONS.CRYPTO);
    if (!data) {
        data = await db.insertData({ id: msg.author.id, portfolio: {}, history: {}, addhistory:{} }, COLLECTIONS.CRYPTO, true);
    }
    

    if (!data.portfolio[ticker]) {
        msg.reply(`That token is not in your portfolio.`);
        return;
    }

    // data.portfolio[ticker] -= amount;

    // if (data.portfolio[ticker] <= 0) {
    delete data.portfolio[ticker];
    delete data.history[ticker];
    delete data.addhistory[ticker];
    // }

    await db.updatePartialData(data._id, { portfolio: data.portfolio, history: data.history, addhistory: data.addhistory }, COLLECTIONS.CRYPTO);
    if (data.privacy) {
        msg.author.send(`Removed $${ticker.toUpperCase()} from your portfolio.`).catch((err) => {
            msg.reply(`Could not send you a private message. Open your DMs nerd.`);
        });
    } else {
        msg.reply(`Removed $${ticker.toUpperCase()} from your portfolio.`);
    }

    try{
        msg.delete();
    }catch{
        console.log("error deleting the command message")
    }
    
}
