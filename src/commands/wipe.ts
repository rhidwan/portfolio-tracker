import * as Discord from 'discord.js';
import { registerCommand } from '../service/commands';
import { COLLECTIONS } from '../enums/collections';
import { IPortfolio } from '../interfaces/IPortfolio';
import { getDatabase } from '../utility/database';

registerCommand({ name: 'wipe', command, description: 'Wipe your portfolio.' });

async function command(msg: Discord.Message) {
    const db = await getDatabase();

    let data: IPortfolio = await db.fetchData('id', msg.author.id, COLLECTIONS.CRYPTO);
    if (!data) {
        data = await db.insertData({ id: msg.author.id, portfolio: {} }, COLLECTIONS.CRYPTO, true);
    }

    data.portfolio = {};
    data.history = {};
    await db.updatePartialData(data._id, { history: data.history, portfolio: data.portfolio }, COLLECTIONS.CRYPTO);

    if (!data.privacy) {
        msg.reply('Portfolio Wiped');
    } else {
        msg.author.send('Portfolio Wiped');
    }

    try{
        msg.delete();
    }catch{
        console.log("error deleting the command message")
    }
    
}
