import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import vapiService from '../services/vapiService.js';

const VoiceChat = ({ onVoiceMessage, className = '' }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Vapi service
    const initializeVapi = () => {
      try {
        // You'll need to add your Vapi API key to .env
        const vapiApiKey = import.meta.env.VITE_VAPI_API_KEY;
        
        if (!vapiApiKey) {
          setError('Vapi API key not found. Please add VITE_VAPI_API_KEY to your .env file.');
          return;
        }

        vapiService.initialize(vapiApiKey);
        setIsInitialized(true);

        // Set up callbacks
        vapiService.onCallStart(() => {
          setIsCallActive(true);
          setError(null);
        });

        vapiService.onCallEnd(() => {
          setIsCallActive(false);
        });

        vapiService.onMessage((message) => {
          if (onVoiceMessage) {
            onVoiceMessage(message);
          }
        });

      } catch (err) {
        console.error('Failed to initialize Vapi:', err);
        setError('Failed to initialize voice service');
      }
    };

    initializeVapi();

    // Volume monitoring
    const volumeInterval = setInterval(() => {
      if (vapiService.isActive()) {
        const currentVolume = vapiService.getVolume();
        setVolume(currentVolume);
      } else {
        setVolume(0);
      }
    }, 100);

    return () => {
      clearInterval(volumeInterval);
      if (vapiService.isActive()) {
        vapiService.endCall();
      }
    };
  }, [onVoiceMessage]);

  const toggleVoiceCall = async () => {
    if (!isInitialized) {
      setError('Voice service not initialized');
      return;
    }

    try {
      if (isCallActive) {
        await vapiService.endCall();
      } else {
        await vapiService.startCall();
      }
    } catch (err) {
      console.error('Error toggling voice call:', err);
      if (err.message.includes('API key')) {
        setError('Invalid Vapi API key. Please check your .env file.');
      } else {
        setError(`Failed to start voice call: ${err.message}`);
      }
    }
  };

  return (
    <div className={`voice-chat ${className}`}>
      <div className="voice-controls">
        <button
          onClick={toggleVoiceCall}
          disabled={!isInitialized}
          className={`voice-button ${isCallActive ? 'active' : ''} ${!isInitialized ? 'disabled' : ''}`}
          title={isCallActive ? 'End voice chat' : 'Start voice chat'}
        >
          {isCallActive ? (
            <MicOff size={20} />
          ) : (
            <Mic size={20} />
          )}
        </button>
        
        {isCallActive && (
          <div className="voice-status">
            <Volume2 size={16} />
            <div className="volume-indicator">
              <div 
                className="volume-bar" 
                style={{ height: `${Math.min(volume * 100, 100)}%` }}
              />
            </div>
            <span className="status-text">Listening...</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="voice-error">
          <span>{error}</span>
        </div>
      )}
      
      {!isInitialized && !error && (
        <div className="voice-loading">
          <span>Initializing voice service...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;