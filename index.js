const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
require("dotenv").config();
const mongoose = require("mongoose");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

mongoose.connect(
  "mongodb+srv://chazrose:Z67CyvGBakoBCUt4@cluster0.tdswryf.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const commands = [
  {
    name: "add",
    options: [
      {
        name: "phone",
        description: "The phone number of the person you are reporting.",
        type: 3,
        required: true,
      },
      {
        name: "reason",
        description: "The reason or additional details about the report.",
        type: 3,
        required: false,
      },
    ],
    description: "Add a report to the database.",
  },
  {
    name: "check",
    options: [
      {
        name: "phone",
        description: "The phone number that you want to check.",
        type: 3,
        required: true,
      },
    ],
    description: "Check the database for a report.",
  },
  {
    name: "ping",
    description: "Ping the bot.",
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
rest
  .put(Routes.applicationCommands("1175199439158263870"), { body: commands })
  .then((res) =>
    console.log("Successfully registered application commands.", res)
  )
  .catch(console.error);

const reportSchema = new mongoose.Schema({
  reason: String,
  timestamp: { type: Date, default: Date.now },
  phoneNumber: String,
  user: String,
});

const Report = mongoose.model("Report", reportSchema);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }

  if (interaction.commandName === "add") {
    const reports = await Report.find({
      phoneNumber: interaction.options.getString("phone"),
    });
    if (reports.length > 0) {
      await interaction.reply("This number is already in the database.");
      return;
    }
    const phone = interaction.options.getString("phone");
    const reason = interaction.options.getString("reason");
    const report = new Report({
      phoneNumber: phone,
      reason: reason,
      user: interaction.user.tag,
    });
    await report.save();
    await interaction.reply("Report added!");
  }

  if (interaction.commandName === "check") {
    const phone = interaction.options.getString("phone");
    const reports = await Report.find({ phoneNumber: phone });
    if (reports.length === 0) {
      await interaction.reply("No reports found.");
    } else {
      const report = reports[0];
      await interaction.reply(
        `Report found! Reason: ${report.reason} | User: ${report.user}`
      );
    }
  }
});

client.login(process.env.BOT_TOKEN);
