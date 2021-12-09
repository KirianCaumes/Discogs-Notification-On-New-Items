# Discogs: notification on new items

A simple script to get email notification of new items by an artist on Discogs.

## Why this project?

If want to have notification of new item added to Discogs of an artist, you can use the List system and activate notifications. Sadly, you will only receive notifications on "Release" release and not about "Appearances" and "Unofficial". That's the objective of this project.

## Dev

Open folder with Visual Studio Code.

Install `ms-vscode-remote.remote-containers` extension.

Open Visual Code in Container : click in the green icon on bottom left screen, and choose `Open in Container` (Docker required).

Wait for container to setup, and that's it!

Create and setup a `.dotenv` according to the `.env.example` file.

You can start the script with:

```sh
npm start
```

## Deploy to Heroku

### Create a new App

Go to you [dashboard](https://dashboard.heroku.com/apps).

Click on `New` and `Create a new app`.

Set an `App name`, pick a region and click on `Create app`

### Deploy and configure the script

In the **Deploy** tab:

- On `Deployment method`, select `Github`.
- On `Automatic deploys`, choose `Connect to GitHub`, search for you repository and click on `Connect`.
- On `Automatic deploys`, choose your branch and click on `Enable Automatic Deploys`.
- On `Manual deploy`, click on `Deploy Branch` with the correct branch set and wait to deployment to end.

In the **Settings** tab, set the environement variables you want by clicking on `Reveal Config Vars` in `Config Vars`.

### Disable web service (Optional)

Open a terminal in your machine and run:

```sh
heroku scale web=0 -a <YOUR-APP-NAME>
# Example: heroku scale web=0 -a discogs-notif-new-items
```

This will prevent your new app to start as a Web Application.

### Test your script

You can test your script with a terminal:

```sh
heroku run <YOU-SCRIPT> -a <YOUR-APP-NAME>
# Example: heroku run npm start -a discogs-notif-new-items
```

### Condigure the schedule task

In the **Ressource** tab:

- Search for `Heroku Scheduler` in the Add-ons search bar, and click on it.
- Click on `Submit Order Form`.
- Click on `Heroku Scheduler` with the link icon.
- Click on `Create job` and choose you schedule settings, for example set the schedule for "Every 10 minutes" and command to "npm start".

### You're done

Everything should be working now, you can check you schedule task logs on a terminal with:

```sh
heroku logs --tail -a <YOUR-APP-NAME>
# Example: heroku logs --tail -a discogs-notif-new-items
```

### Install SendGrid (Optional)

In the **Ressource** tab:

- Search for `Twilio Sengrid` in the Add-ons search bar, and click on it.
- Pick `Starter - Free` and click on `Submit Order Form`.
- Click on `Twilio Sengrid` with the link icon.
- Click on `Create a Single Sender` and login with your account (if needed).
- Set the informations
- Go to `Settings`/`API Keys`, then click `Create API Key`, choose a name, set `Full access` and click `Create & View`

Do not forget to setup 2FA.
