# Discogs Notification On New Items

A useful script to get email notifications of new items by one or more artist(s) on Discogs. 📨

![Example](https://user-images.githubusercontent.com/24525092/220758145-696920f6-e336-43a9-b579-d250fd519edd.png)

## Why this project?

If you want to be notified of new items added to Discogs from one or more artists, you can use the list system and enable notifications. 🤔

Unfortunately, you will only receive notifications on "Release" versions and not on "Appearances" and "Unofficial". 😓

This is the goal of this project. 👈

## How to deploy in production

Create and setup a `.env` according to the `.env.example` file.

Install dependencies with:

```sh
npm install
```

Start the script with a scheduled task:

```sh
npm start
```

## How to contribute/develop

There is a [devcontainer](https://code.visualstudio.com/docs/devcontainers/containers) on that project already configured, feel free to use it.

Create and setup a `.env` according to the `.env.example` file.

Install dependencies with:

```sh
npm install
```

Start the script:

```sh
npm start
```

You can open a pull request with your new additions.
