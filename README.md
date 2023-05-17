# Replicate models – a ChatGPT plugin

A simple plugin based on https://github.com/openai/plugins-quickstart

## Development

Preqrequisites:

- Access to OpenAI's plugin beta
- [Node.js](https://nodejs.org) for running the server
- [ngrok](https://ngrok.com/) for port forwarding

Clone this repo and install dependencies:

```
git clone https://github.com/fofr/replicate-models-chatgpt-plugin
cd replicate-models-chatgpt-plugin
npm install
```

Start the server:

```
npm run dev
```

Start up ngrok, pointing at port 5003:

```
ngrok http 5003
```

Create `.env` and set your ngrok URL as the `APP_HOST`:

```
APP_HOST="https://0dc4a909eb0e.ngrok.app"
```

Grab your Replicate API token from https://replicate.com/account, then paste it into .env:

```
REPLICATE_API_TOKEN=r8_...
```

Configure ChatGPT to use the plugin:

1. Go to https://chat.openai.com
1. Click Plugins dropdown
1. Click Plugin store
1. Click 'Develop your own plugin'
1. Use your ngrok host as the domain
