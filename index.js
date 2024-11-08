const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

require('dotenv').config();

const allowedUserIDs = ['ID_1', 'ID_2']; // Add your allowed IDs here


const archiveFolder = path.join(__dirname, 'archives');
if (!fs.existsSync(archiveFolder)) {
    fs.mkdirSync(archiveFolder);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!archive') || message.author.bot) return;

    if (!allowedUserIDs.includes(message.author.id)) {
        return message.reply('You do not have permission to use this command.');
    }

    const args = message.content.split(' ');
    const amount = parseInt(args[1]);
    const channelMention = args[2];

    if (!amount || isNaN(amount) || amount < 1) {
        return message.reply('Please provide a valid number of messages to archive (e.g., `!archive 100 #channel`).');
    }

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(channelMention);

    if (!channel) {
        return message.reply('Please specify a valid channel (e.g., `!archive 100 #channel`).');
    }

    try {
        const messages = await channel.messages.fetch({ limit: amount });
        const archive = messages.map(msg => {
            const timestamp = new Date(msg.createdTimestamp).toLocaleString();
            const attachments = msg.attachments.size > 0 ? msg.attachments.map(a => a.url).join(', ') : 'No Attachments';
            return `[${timestamp}] ${msg.author.tag} (${msg.author.id}): ${msg.content} | Attachments: ${attachments}`;
        }).join('\n');

        const fileName = `archive_${channel.id}_${Date.now()}.txt`;
        const filePath = path.join(archiveFolder, fileName);

        await fs.promises.writeFile(filePath, archive);

        await message.reply({
            content: `✅ Archive successfully created with ${messages.size} messages! You can download the file below:`,
            files: [fileName],
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        message.reply('❌ There was an error trying to archive the messages. Please try again later.');
    }
});

client.login(process.env.TOKEN);
