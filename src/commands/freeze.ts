import {registerCommand} from '../service/commands';
import * as Discord from 'discord.js';
import { COLLECTIONS } from '../enums/collections';
// const fs = require('fs')
const fs = require('fs');
var path = require('path');


var config_file_path = path.resolve(__dirname, "../config/config.json");




registerCommand({ name: 'freeze', command, description: 'Freeze/unfreeze add or remove' });
async function command(msg: Discord.Message, skey: string) {
    
    // if (!skey) {
    //     msg.reply('Must supply a security key.');
    //     return;
    // }
    console.log(msg.member.hasPermission("ADMINISTRATOR"))
    if (!msg.member.hasPermission("ADMINISTRATOR")){
        console.log("You are not an admin");
        return;
    } 
    let content = JSON.parse(fs.readFileSync(config_file_path, 'utf8'));
    // edit or add property
    content.freeze = !content.freeze;
    //write file
    fs.writeFileSync(config_file_path, JSON.stringify(content ,null,'\r\n'), 'utf8');


 
    msg.reply(`Freeze status: ${content.freeze}`);
    try{
        msg.delete();
    }catch{
        console.log("error deleting the command message")
    }
    
}
