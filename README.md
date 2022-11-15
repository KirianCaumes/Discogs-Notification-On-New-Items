# Discogs: notification on new items

A simple script to get email notifications of new items by one or more artist(s) on Discogs.

## Why this project?

If want you to have notification of new items added to Discogs of one or more artist(s), you can use the List system and activate notifications. Sadly, you will only receive notifications on "Release" release and not about "Appearances" and "Unofficial". That's the goal of this project.

## Run in dev

Open folder with Visual Studio Code.

Install `ms-vscode-remote.remote-containers` extension.

Open Visual Code in Container: click on the green button at the bottom left of the screen, and choose `Open in Container` (Docker required).

Wait for the container to start, and that's it!

Create and setup a `.env` according to the `.env.example` file.

Start the script with:

```sh
npm start
```

## Run in prod

Create and setup a `.env` according to the `.env.example` file.

Start the script with a planified task:

```sh
npm start
```
