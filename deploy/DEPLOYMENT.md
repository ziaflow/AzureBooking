# Deployment Guide for ZiaFlow Bot

This guide explains how to deploy the Virtual Appointments application (hosting the Chat Bot and Real-Time Voice Agent Bridge) to your Azure Web App (`Astro-container-test-chat`).

## Prerequisites

- **Azure CLI** installed and logged in.
- **Docker** installed (if using container deployment).
- Access to the **Azure Portal**.

## Option 1: Container Deployment (Recommended)

Since your Web App name suggests a container environment (`Astro-container-test-chat`), this is the preferred method.

### 1. Build the Docker Image

Navigate to the root of the repository and run:

```bash
docker build -t ziaflow-bot:latest .
```

### 2. Push to Azure Container Registry (ACR)

If you have an Azure Container Registry:

```bash
az acr login --name <your-registry-name>
docker tag ziaflow-bot:latest <your-registry-name>.azurecr.io/ziaflow-bot:latest
docker push <your-registry-name>.azurecr.io/ziaflow-bot:latest
```

### 3. Configure Web App to Run the Container

1.  Go to your Web App in the Azure Portal: [Astro-container-test-chat](https://portal.azure.com/#@ziaflow.com/resource/subscriptions/2b43bd71-b987-494a-9a53-0f0731481755/resourceGroups/ZiaFlow-Prod/providers/Microsoft.Web/sites/Astro-container-test-chat/analytics).
2.  Under **Deployment Center**, select **Container Registry** as the source.
3.  Select your ACR and the image `ziaflow-bot:latest`.
4.  Save.

## Option 2: Zip Deployment (Code-based)

If you prefer to deploy the code directly without Docker:

1.  Build the project locally:
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    cd ..
    npm run package
    ```
2.  Create a zip of the `dist` folder:
    - On Windows: Send `dist` content to Compressed (zipped) folder.
    - On Mac/Linux: `cd dist && zip -r ../deploy.zip .`
3.  Deploy using Azure CLI:
    ```bash
    az webapp deployment source config-zip --resource-group ZiaFlow-Prod --name Astro-container-test-chat --src deploy.zip
    ```

## Configuration (Environment Variables)

After deployment, you must configure the **Environment Variables** in the Azure Portal (under **Settings > Environment Variables** or **Configuration**).

Add the following settings:

| Variable Name | Value Description |
| :--- | :--- |
| `VV_COMMUNICATION_SERVICES_CONNECTION_STRING` | Your ACS Connection String. |
| `VV_MICROSOFT_BOOKINGS_URL` | (Optional) Your Bookings Page URL. |
| `VV_CHAT_ENABLED` | `true` |
| `VV_BOT_APP_ID` | The Client ID of your **Bot Service** (`bot-test-service`). |
| `VV_LOGIC_APP_URL` | The URL for the Lead Gen Logic App (if created). |
| `VV_OPENAI_REALTIME_ENDPOINT` | `wss://<your-openai-resource>.openai.azure.com` |
| `VV_OPENAI_REALTIME_API_KEY` | Your Azure OpenAI API Key. |
| `VV_OPENAI_REALTIME_DEPLOYMENT` | The model deployment name (e.g., `gpt-4o-realtime`). |
| `VV_SERVER_WEBSOCKET_URL` | The public URL of your Web App (e.g., `wss://astro-container-test-chat.azurewebsites.net`). |
| `VV_SERVER_HTTP_URL` | The public URL of your Web App (e.g., `https://astro-container-test-chat.azurewebsites.net`). |

## Integrating with ZiaFlow.com

To "deploy to ziaflow.com", you have two main options:

### 1. Embed the Chat/Appointment Widget

You can embed the chat lead generation form directly into your existing website using an `iframe`.

```html
<iframe
  src="https://astro-container-test-chat.azurewebsites.net/chat"
  width="400"
  height="600"
  frameborder="0"
  style="position: fixed; bottom: 20px; right: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999;">
</iframe>
```

### 2. Custom Domain (CNAME)

If you want the bot to be accessible at `bot.ziaflow.com` or similar:

1.  In the Azure Portal, go to **Custom domains**.
2.  Add a custom domain `bot.ziaflow.com`.
3.  Update your DNS provider (GoDaddy, Cloudflare, etc.) to add a CNAME record pointing `bot.ziaflow.com` to `astro-container-test-chat.azurewebsites.net`.

## Connecting the Real-Time Voice Agent

To enable the Voice Agent to answer calls:

1.  Go to your **Azure Communication Services** resource in the Azure Portal.
2.  Navigate to **Events** (Event Grid).
3.  Create an **Event Subscription**:
    - **Name**: `VoiceAgentIncomingCall`
    - **Event Types**: `Incoming Call`
    - **Endpoint Type**: `Web Hook`
    - **Endpoint**: `https://astro-container-test-chat.azurewebsites.net/api/incomingCall`
4.  Call your ACS phone number. The bot should answer and connect to OpenAI.
