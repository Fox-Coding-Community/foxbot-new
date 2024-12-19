const { readdirSync } = require('fs'),
    ascii = require('ascii-table'),
    table = new ascii('Commands');
table.setHeading('Command Name', 'Loaded Status');

module.exports = (client) => {
    readdirSync('./commands/').forEach(dir => {
        const commands = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'));
        for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`);
            if (pull.name) {
                client.commands.set(pull.name, pull);
                table.addRow(pull.name, '✅');
            } else {
                table.addRow(pull.name, `❌  -> missing a help.name, or help.name is not a string.`);
                continue;
            }
        }
    });
};