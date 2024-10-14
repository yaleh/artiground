import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DeepChat } from 'deep-chat-react';
import { Button, Box } from '@mui/material';
import ChatSettings from './ChatSettings';
import { useSystemPrompt, SystemPromptProvider } from './SystemPromptContext';
import { updateHistory } from './utils/historyUtils';
import { interceptRequest } from './utils/requestInterceptor';
import { processResponseArtifacts } from './utils/responseInterceptor';

const ChatContent: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [url, setUrl] = useState('https://api.openai.com/v1/chat/completions');
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHistory, setApiKeyHistory] = useState<string[]>([]);
  const [model, setModel] = useState('gpt-4o');
  const [modelHistory, setModelHistory] = useState<string[]>([]);
  const [reload, setReload] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [fileList, setFileList] = useState<string[]>([]);

  const chatRef = useRef<any>(null);

  const { systemPrompt } = useSystemPrompt();

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
  }, [url, apiKey, model]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).sandpackController) {
      const files = (window as any).sandpackController.getFiles();
      const paths = Object.keys(files);
      setFileList(paths);
    }
  }, []);

  const variables = useMemo(() => ({
    fileList: JSON.stringify(fileList)
  }), [fileList]);

  const handleUpdateHistory = useCallback((
    value: string, 
    history: string[], 
    setHistory: React.Dispatch<React.SetStateAction<string[]>>, 
    key: string
  ) => {
    if (!isInitialLoad) {
      const updatedHistory = updateHistory(value, history);
      setHistory(updatedHistory);
      localStorage.setItem(key, JSON.stringify(updatedHistory));
    }
  }, [isInitialLoad]);

  const handleUrlConfirm = useCallback(() => {
    handleUpdateHistory(url, urlHistory, setUrlHistory, 'urlHistory');
  }, [url, urlHistory, handleUpdateHistory]);

  const handleApiKeyConfirm = useCallback(() => {
    handleUpdateHistory(apiKey, apiKeyHistory, setApiKeyHistory, 'apiKeyHistory');
  }, [apiKey, apiKeyHistory, handleUpdateHistory]);

  const handleModelConfirm = useCallback(() => {
    handleUpdateHistory(model, modelHistory, setModelHistory, 'modelHistory');
  }, [model, modelHistory, handleUpdateHistory]);

  const handleClearChat = () => {
    if (chatRef.current) {
      chatRef.current.clearMessages();
    }
  };

  const handleRequestInterceptor = useCallback((requestDetails: any) => {
    return interceptRequest(systemPrompt, requestDetails, variables);
  }, [systemPrompt, variables]);

  const handleResponseInterceptor = useCallback((response: any) => {
    if (response && response.choices && Array.isArray(response.choices)) {
      return {
        ...response,
        choices: response.choices.map((choice: any) => ({
          ...choice,
          message: {
            ...choice.message,
            content: processResponseArtifacts(choice.message.content)
          }
        }))
      };
    }
    return response;
  }, []);

  const handleGetSandpackFiles = () => {
    if (typeof window !== 'undefined' && (window as any).sandpackController) {
      const files = (window as any).sandpackController.getFiles();
      const fileList = Object.keys(files)
        .map(path => `- ${path}`)
        .join('\n');
      
      if (chatRef.current) {
        chatRef.current.addMessage({
          text: `Project Files:\n${fileList}`,
          role: 'user'
        });
      }
    } else {
      console.error('Sandpack controller not available');
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
                model: model
              },
            }
          }}
          connect={{ url: url }}
          style={{ borderRadius: '4px', width: '100%', height: '100%' }}
          messageStyles={{
            default: {
              shared: {
                bubble: {
                  maxWidth: '100%',
                  backgroundColor: 'unset',
                  marginTop: '10px',
                  marginBottom: '10px'
                }
              },
              user: {
                bubble: {
                  marginLeft: '0px',
                  color: 'black'
                }
              },
              ai: {
                outerContainer: {
                  backgroundColor: 'rgba(247,247,248)',
                  borderTop: '1px solid rgba(0,0,0,.1)',
                  borderBottom: '1px solid rgba(0,0,0,.1)'
                }
              }
            }
          }}
          textInput={{ placeholder: { text: 'Ask about the code...' } }}
          submitButtonStyles={{
            submit: { container: { default: { backgroundColor: '#007bff' } } },
          }}
          requestInterceptor={handleRequestInterceptor}
          responseInterceptor={handleResponseInterceptor}
          demo={true}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Button 
          variant="contained" 
          color="inherit"
          onClick={handleClearChat}
          sx={{ backgroundColor: 'grey.400' }}
        >
          Reset Chat
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleGetSandpackFiles}
        >
          Get Sandpack Files
        </Button>
      </Box>
    </Box>
  );
};

const Chat: React.FC = () => {
  return (
    <SystemPromptProvider>
      <ChatContent />
    </SystemPromptProvider>
  );
};

export default Chat;
