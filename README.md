# M'naago

A FFXIV Discord Bot for character profiles and lodestone news.

## Features

- 📰 Automated Lodestone news notifications (Topics, Notices, Maintenances, Updates, Statuses)
- 🛠️ Command to view active maintenances
- 🎮 Character profile lookup from FFXIV Lodestone
- 🎨 Customizable profile themes
- ⭐ Character favorites system
- ✅ Character verification

## Add the bot to your server

[Click here](https://discord.com/oauth2/authorize?client_id=913245198685995048&permissions=314368&scope=applications.commands+bot)
to add the bot to your server.

## Commands

- `/help` - Command overview and explanations.
- `/ping` - Bot's latency and uptime.
- `/verify add` - Verify your character.
- `/verify remove` - Unlink your character and delete all stored data of you.
- `/setup theme` - Set a theme for your verified character's profile.
- `/profile me` - Your verified character's profile.
- `/profile find` - View anyone's character profile.
- `/profile favorite` - Get a favorite character's profile.
- `/favorite add` - Add a character to your favorites.
- `/favorite remove` - Remove a character from your favorites.
- `/liveletter` - Shows information about the next or current Live Letter.
- `/maintenance` - Current maintenances if any.
- `/setup lodestone` - Set up automated lodestone news notifications.

## For developers

### Development setup

1. **Configure the bot**

   Copy the skeleton file for environment variables and fill them accordingly:
   ```bash
   cp .env.skel .env && nano .env
   ```
   ```ps1
   Copy-Item .env.skel .env; notepad .env
   ```

2. **Create Discord application and upload emojis**

If you haven't yet, create a Discord application on the Discord Developer Portal. After that, head to the emoji page and
upload the ones from `emoji/`. Copy the markdown of these emojis and fill them into your `.env` file.

3. **Start all services**

   ```bash
   docker compose up -d --build
   ```

4. **Connect to shell of app container**

   ```bash
   docker exec -it naago-app-dev /bin/bash
   ```

- **In the shell, you can to the following**

  Deploy Commands to your development Discord server:
  ```bash
  deno run deploy-commands
  ```

  Start the bot:
  ```bash
  deno run start
  ```

  Generate a migration:
  ```bash
  deno run db:generate
  ```

  Run migrations manually:
  ```bash
  deno run db:migrate
  ```

- **View logs**

  ```bash
  docker compose logs -f
  ```

- **Rebuild only the app container**
  ```bash
  docker compose up -d --build app
  ```

- **Shut down all containers**

  ```bash
  docker compose down
  ```

- **Delete volume (resets development database)**

  ```bash
  docker volume rm naago_mysql_data_dev
  ```

- **Access phpMyAdmin** http://localhost:8080 (adjust port to your .env)
