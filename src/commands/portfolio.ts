import AsciiTable from 'ascii-table';
import * as Discord from 'discord.js';

import { COLLECTIONS } from '../enums/collections';
import { IAddHistory } from '../interfaces/IAddHistory';
import { IPortfolio, IPortfolioFull } from '../interfaces/IPortfolio';
import { registerCommand } from '../service/commands';
import { getPortfolioStats, updatePortfolio } from '../utility/algorithms';
import { getDatabase } from '../utility/database';

export async function periodicPortfolio(member: Discord.User) {
    const db = await getDatabase();

    let data: IPortfolio = await db.fetchData('id', member.id, COLLECTIONS.CRYPTO);
    if (!data) {
        data = await db.insertData({ id: member.id, portfolio: {} }, COLLECTIONS.CRYPTO, true);
    }

    await member.send(`Fetching Portfolio...`);

    const descriptions = await portfolioHandler(data);
    for (let i = 0; i < descriptions.length; i++) {
        member.send(descriptions[i]);
    }
}

async function command(msg: Discord.Message) {
    const db = await getDatabase();

    let data: IPortfolio = await db.fetchData('id', msg.author.id, COLLECTIONS.CRYPTO);
    if (!data) {
        data = await db.insertData({ id: msg.author.id, portfolio: {} }, COLLECTIONS.CRYPTO, true);
    }

    if (!data.portfolio || Object.keys(data.portfolio).length <= 0) {
        msg.reply(`You do not have a portfolio.`);
        return;
    }

    const descriptions = await portfolioHandler(data);

    for (let i = 0; i < descriptions.length; i++) {
        if (data.privacy) {
            msg.author.send(descriptions[i]).catch((err) => {
                msg.reply('Open your DMs if you run this in privacy mode.');
            });
        } else {
            msg.reply(descriptions[i]);
        }
    }
}

async function portfolioHandler(data: IPortfolio): Promise<Array<string>> {
    const db = await getDatabase();

    if (!data.history) {
        data.history = {};
    }

    console.log(`[BOT] Getting Portfolio for ${data._id}`);

    const addhistories = data.addhistory;
    // console.log(addhistories);

    const stats: IPortfolioFull = await getPortfolioStats(data);
    const descriptions: Array<string> = [];
    let portfolioTable = new AsciiTable('');
    let newTable = true;
    let noHeading = false;
    let description = '```';
    let count = 0;
    let grandTotalBuyValue = 0;
    let grandTotalCurrentValue = 0;


    for (let i = 0; i < stats.portfolio.length; i++) {
        // Create the Table Style
        if (newTable) {
            newTable = false;

            if (!noHeading) {
                portfolioTable.setHeading('$', `COIN COST`, `QTY`, `TOTAL COST`, `CURRENT POSITION`, `CHANGE`, `% CHANGE`);
            }
            portfolioTable.setHeadingAlign(AsciiTable.RIGHT);
        }
        // console.log(stats);
        const coin = stats.portfolio[i];
        const ticker = coin.ticker;
        const Amount = coin.amount;

        // const currentValue = parseFloat(coin.value.toFixed(2)).toLocaleString();
        const currentValue = coin.value;
        grandTotalCurrentValue += currentValue;
        const buyCoin = addhistories[ticker][0].price;
        const buyValue = addhistories[ticker][0].value;
        grandTotalBuyValue += buyValue;
        const tChange = currentValue - buyValue;
        const pChange = ((currentValue - buyValue)/buyValue) * 100;

        // console.log(ticker, Amount, buyValue, currentValue, stats);

        // let sum = 0; //we will calculate the average of the addhistory price
        // addhistories[ticker].forEach(item => {
        //     sum += item.value
        // });
        // let average = sum/coin.amount;
        // console.log("Sum", sum)
        // console.log("Average is : ", average);
        // const fixedDiff = parseFloat((coin.value - sum).toFixed(2)).toLocaleString() ;
        
        // if (addhistories) {
        //     for (let e of addhistories) if (e && e.hasOwnProperty(parameter)) sum += e[parameter];
        //   }
        // const change = "0" //put logic here
        
        portfolioTable.addRow(
                ticker.toUpperCase(),
                `$${parseFloat(buyCoin.toFixed(2)).toLocaleString()}` ,
                `$${parseFloat(Amount.toFixed(2)).toLocaleString()}` ,
                `$${parseFloat(buyValue.toFixed(2)).toLocaleString()}` ,
                `$${parseFloat(currentValue.toFixed(2)).toLocaleString()}` ,
                `$${parseFloat(tChange.toFixed(2)).toLocaleString()}` ,
                `${parseFloat(pChange.toFixed(2)).toLocaleString()}%` 
            );
        
        portfolioTable.setAlign(i, AsciiTable.RIGHT);
        count += 1;

        // Determine if we need to send this early.
        // Helps with scaling the portfolio when it's too big.
        if (count <= 18 && i !== stats.portfolio.length - 1) {
            continue;
        }

        // Send It!
        count = 0;
        newTable = true;
        noHeading = true;

        description += portfolioTable.toString();
        description += '```';

        descriptions.push(description);
        description = '```'; // Reset the description.

        portfolioTable = new AsciiTable('');
    }
    console.log("stats total", stats.total, "grand total", grandTotalCurrentValue);
    const totalsTable = new AsciiTable();
    totalsTable.setHeading(`TOTAL`, `TOTAL $ CHANGE`, `TOTAL % CHANGE`);
    totalsTable.setHeadingAlign(AsciiTable.RIGHT);
    totalsTable.addRow(
        `$${parseFloat(stats.total.toFixed(2)).toLocaleString()}`,
        `$${parseFloat((grandTotalCurrentValue - grandTotalBuyValue).toFixed(2)).toLocaleString()}` ,
        `${parseFloat((((grandTotalCurrentValue - grandTotalBuyValue)/grandTotalBuyValue)* 100).toFixed(2)).toLocaleString()}%` ,

    );

    description += totalsTable.toString();
    description += '```';
    descriptions.push(description);

    const newData = updatePortfolio(data, stats.portfolio);
    await db.updatePartialData(data._id, { history: newData.history }, COLLECTIONS.CRYPTO);

    console.log(`[BOT] Finished Portfolio Update for ${data._id}`);

    return descriptions;
}

registerCommand({ name: 'portfolio', command, description: ' Print your portfolio.' });
