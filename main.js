require('dotenv').config();

const { Client, GatewayIntentBits, Partials, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel]
});

const PREFIX = ".";

client.once('ready', () => {
    console.log(`Bot đã đăng nhập với tên ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    const { guild, user } = interaction;
    
    if (interaction.customId === "create_ticket") {
        const existingChannel = guild.channels.cache.find(channel => channel.name === `ticket-${user.username}`);
        
        if (existingChannel) {
            await interaction.reply({ content: "Bạn đã có một ticket rồi!", ephemeral: true });
        } else {
            await interaction.reply({ content: "Đang tạo ticket cho bạn... vui lòng chờ.", ephemeral: true });
            
            let category = guild.channels.cache.find(c => c.name === "Tickets" && c.type === 4);
            if (!category) {
                category = await guild.channels.create({ name: "Tickets", type: 4 });
            }
            
            const supportRoleIds = [
                '1270344576137302116',  // Thay ID role hỗ trợ của bạn vào đây
                '1348519309730775092',
            ];
            
            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
            ];
            
            supportRoleIds.forEach(roleId => {
                permissionOverwrites.push({
                    id: roleId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                });
            });
            
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: 0,
                parent: category.id,
                permissionOverwrites: permissionOverwrites
            });
            
            const deleteButton = new ButtonBuilder()
                .setCustomId("delete_ticket")
                .setLabel("Đóng Ticket")
                .setStyle(ButtonStyle.Danger);
            
            const row = new ActionRowBuilder().addComponents(deleteButton);
            
            const supportRoleMentions = supportRoleIds.map(roleId => `<@&${roleId}>`).join(' ');
            
            await ticketChannel.send({ content: `Chào ${user}, chờ tí sẽ có người hỗ trợ bạn. ${supportRoleMentions} dậy đón khách nè^^`, components: [row] });
            await interaction.followUp({ content: `Ticket của bạn đã được tạo: ${ticketChannel}`, ephemeral: true });
        }
    }
    
    if (interaction.customId === "delete_ticket") {
        const channel = interaction.channel;
        await channel.delete();
    }
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    
    if (command === "ticket") {
        const createButton = new ButtonBuilder()
            .setCustomId("create_ticket")
            .setLabel("Tạo Ticket")
            .setStyle(ButtonStyle.Success);
        
        const row = new ActionRowBuilder().addComponents(createButton);
        
        await message.channel.send({ content: "Nhấn vào nút dưới đây để tạo ticket.", components: [row] });
    }
    
    if (command === "close") {
        if (!message.channel.name.startsWith("ticket-")) {
            return message.reply("Bạn chỉ có thể dùng lệnh này trong kênh ticket!");
        }
        
        await message.channel.send("Đóng ticket trong 5 giây...");
        setTimeout(() => message.channel.delete(), 5000);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
