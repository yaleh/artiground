import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DeepChat } from 'deep-chat-react';
import { Button, Box } from '@mui/material';
import ChatSettings from './ChatSettings';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [url, setUrl] = useState('https://api.openai.com/v1/chat/completions');
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHistory, setApiKeyHistory] = useState<string[]>([]);
  const [model, setModel] = useState('gpt-4o');
  const [modelHistory, setModelHistory] = useState<string[]>([]);
  const [reload, setReload] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');

  const chatRef = useRef<any>(null);

  useEffect(() => {
    const loadHistory = (key: string) => {
      const savedHistory = localStorage.getItem(key);
      if (savedHistory) {
        try {
          return JSON.parse(savedHistory);
        } catch (error) {
          console.error(`Error parsing ${key} history:`, error);
        }
      }
      return [];
    };

    setUrlHistory(loadHistory('urlHistory'));
    setApiKeyHistory(loadHistory('apiKeyHistory'));
    setModelHistory(loadHistory('modelHistory'));
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    setReload(prev => prev + 1);
  }, [url, apiKey, model, systemPrompt]);

  const handleNewMessage = (message: any) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const updateHistory = useCallback((value: string, history: string[], setHistory: React.Dispatch<React.SetStateAction<string[]>>, key: string) => {
    if (value && !isInitialLoad) {
      const updatedHistory = Array.from(new Set([value, ...history])).slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem(key, JSON.stringify(updatedHistory));
    }
  }, [isInitialLoad]);

  const handleUrlConfirm = useCallback(() => {
    updateHistory(url, urlHistory, setUrlHistory, 'urlHistory');
  }, [url, urlHistory, updateHistory]);

  const handleApiKeyConfirm = useCallback(() => {
    updateHistory(apiKey, apiKeyHistory, setApiKeyHistory, 'apiKeyHistory');
  }, [apiKey, apiKeyHistory, updateHistory]);

  const handleModelConfirm = useCallback(() => {
    updateHistory(model, modelHistory, setModelHistory, 'modelHistory');
  }, [model, modelHistory, updateHistory]);

  const handleClearChat = () => {
    if (chatRef.current) {
      chatRef.current.clearMessages();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ChatSettings
        url={url}
        setUrl={setUrl}
        urlHistory={urlHistory}
        apiKey={apiKey}
        setApiKey={setApiKey}
        apiKeyHistory={apiKeyHistory}
        model={model}
        setModel={setModel}
        modelHistory={modelHistory}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        handleUrlConfirm={handleUrlConfirm}
        handleApiKeyConfirm={handleApiKeyConfirm}
        handleModelConfirm={handleModelConfirm}
        isInitialLoad={isInitialLoad}
      />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <DeepChat
          ref={chatRef}
          key={reload}
          directConnection={{
            openAI: {
              key: apiKey,
              chat: {
                model: model,
                system_prompt: systemPrompt
              },
            }
          }}
          connect={{ url: url }}
          style={{ borderRadius: '8px', width: '100%', height: '100%' }}
          messageStyles={{
            default: {
              shared: { bubble: { backgroundColor: '#f0f0f0', padding: '8px' } },
            },
          }}
          textInput={{ placeholder: { text: 'Ask about the code...' } }}
          submitButtonStyles={{
            submit: { container: { default: { backgroundColor: '#007bff' } } },
          }}
          onNewMessage={handleNewMessage}
          demo={true}
        />
      </Box>
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleClearChat}
        sx={{ mt: 1 }}
      >
        Reset Chat
      </Button>
    </Box>
  );
};

export default Chat;