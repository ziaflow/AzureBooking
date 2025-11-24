// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import WebSocket from 'ws';
import {
  VV_OPENAI_REALTIME_ENDPOINT,
  VV_OPENAI_REALTIME_API_KEY,
  VV_OPENAI_REALTIME_DEPLOYMENT
} from '../constants';

export class RealTimeAgent {
  private acsSocket: WebSocket;
  private openAISocket: WebSocket | null = null;
  private openAIEndpoint: string;
  private openAIKey: string;
  private openAIDeployment: string;

  constructor(acsSocket: WebSocket) {
    this.acsSocket = acsSocket;
    this.openAIEndpoint = process.env[VV_OPENAI_REALTIME_ENDPOINT] || '';
    this.openAIKey = process.env[VV_OPENAI_REALTIME_API_KEY] || '';
    this.openAIDeployment = process.env[VV_OPENAI_REALTIME_DEPLOYMENT] || '';

    this.initialize();
  }

  private async initialize() {
    console.log('Initializing RealTimeAgent...');

    if (!this.openAIEndpoint || !this.openAIKey) {
      console.error('OpenAI Realtime configuration missing');
      return;
    }

    try {
      // Construct the OpenAI Realtime WebSocket URL
      // Format: wss://<resource>.openai.azure.com/openai/realtime?api-version=2024-10-01-preview&deployment=<deployment>
      // Assuming VV_OPENAI_REALTIME_ENDPOINT is the base URL (e.g., wss://resource.openai.azure.com)
      const url = `${this.openAIEndpoint}/openai/realtime?api-version=2024-10-01-preview&deployment=${this.openAIDeployment}`;

      this.openAISocket = new WebSocket(url, {
        headers: {
          'api-key': this.openAIKey,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      this.openAISocket.on('open', () => {
        console.log('Connected to OpenAI Realtime API');
        this.sendSessionUpdate();
      });

      this.openAISocket.on('message', (data: WebSocket.RawData) => {
        this.handleOpenAIMessage(data);
      });

      this.openAISocket.on('error', (err) => {
        console.error('OpenAI WebSocket Error:', err);
      });

      this.openAISocket.on('close', () => {
        console.log('OpenAI WebSocket Closed');
        this.acsSocket.close();
      });

      // Handle ACS messages
      this.acsSocket.on('message', (data: WebSocket.RawData) => {
        this.handleACSMessage(data);
      });

      this.acsSocket.on('close', () => {
        console.log('ACS WebSocket Closed');
        this.openAISocket?.close();
      });

    } catch (e) {
      console.error('Failed to initialize OpenAI connection:', e);
    }
  }

  private sendSessionUpdate() {
    if (!this.openAISocket || this.openAISocket.readyState !== WebSocket.OPEN) return;

    const sessionUpdate = {
      type: 'session.update',
      session: {
        turn_detection: {
          type: 'server_vad'
        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        voice: 'alloy',
        instructions: 'You are a helpful AI assistant. Please answer questions concisely.',
        modalities: ['text', 'audio'],
        temperature: 0.8,
      }
    };

    this.openAISocket.send(JSON.stringify(sessionUpdate));
  }

  private handleACSMessage(data: WebSocket.RawData) {
    try {
        const message = JSON.parse(data.toString());
        if (message.kind === 'AudioData') {
            // ACS sends mixed audio
            // Forward to OpenAI
            if (this.openAISocket && this.openAISocket.readyState === WebSocket.OPEN) {
                const appendEvent = {
                    type: 'input_audio_buffer.append',
                    audio: message.audioData.data // Base64 string
                };
                this.openAISocket.send(JSON.stringify(appendEvent));
            }
        }
    } catch (e) {
        console.error('Error processing ACS message:', e);
    }
  }

  private handleOpenAIMessage(data: WebSocket.RawData) {
    try {
        const event = JSON.parse(data.toString());

        if (event.type === 'response.audio.delta') {
            // Send audio back to ACS
            // ACS expects AudioData format
            const acsAudioPacket = {
                kind: 'AudioData',
                audioData: {
                    data: event.delta, // Base64 string
                    timestamp: new Date().toISOString()
                }
            };

            if (this.acsSocket.readyState === WebSocket.OPEN) {
                this.acsSocket.send(JSON.stringify(acsAudioPacket));
            }
        } else if (event.type === 'response.audio_transcript.done') {
            console.log('AI Response:', event.transcript);
        } else if (event.type === 'error') {
            console.error('OpenAI Error Event:', event.error);
        }
        // Handle other events as needed (e.g. function calls, text delta)
    } catch (e) {
        console.error('Error processing OpenAI message:', e);
    }
  }
}
