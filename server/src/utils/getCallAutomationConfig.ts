// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  VV_AUTO_START_TRANSCRIPTION,
  VV_COGNITIONAPI_ENDPOINT,
  VV_COGNITIONAPI_KEY,
  VV_SERVER_HTTP_URL,
  VV_SERVER_WEBSOCKET_PORT,
  VV_SERVER_WEBSOCKET_URL,
  VV_TRANSCRIPTION_BEHAVIOR,
  VV_USE_SUMMARIZATION
} from '../constants';
import { CallAutomationConfig, ServerConfigModel, TranscriptionClientOptions } from '../models/configModel';

export const getCallAutomationConfig = (defaultConfig: ServerConfigModel): CallAutomationConfig | undefined => {
  const callAutomationConfig = defaultConfig.callAutomation;
  if (!callAutomationConfig) {
    return undefined;
  }

  const transcriptionClientOptions: TranscriptionClientOptions = {
    transcription:
      (process.env[VV_TRANSCRIPTION_BEHAVIOR] as 'auto' | 'manual' | 'none') ??
      callAutomationConfig.clientOptions?.transcription ??
      'none',
    summarization:
      typeof process.env[VV_USE_SUMMARIZATION] === 'string'
        ? process.env[VV_USE_SUMMARIZATION]?.toLowerCase() === 'true'
        : callAutomationConfig.clientOptions?.summarization ?? false
  };

  const config = {
    CognitionAPIEndpoint: process.env[VV_COGNITIONAPI_ENDPOINT] ?? callAutomationConfig.CognitionAPIEndpoint,
    CognitionAPIKey: process.env[VV_COGNITIONAPI_KEY] ?? callAutomationConfig.CognitionAPIKey,
    ServerHttpUrl: process.env[VV_SERVER_HTTP_URL] ?? callAutomationConfig.ServerHttpUrl,
    ServerWebSocketUrl: process.env[VV_SERVER_WEBSOCKET_URL] ?? callAutomationConfig.ServerWebSocketUrl,
    clientOptions: transcriptionClientOptions
  } as CallAutomationConfig;
  return config;
};
