import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  PaperAirplaneIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon
} from '@heroicons/react/24/solid';

interface Message {
  id: string;
  content: string;
  image?: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatProps {
  className?: string;
}

export const AIChat: React.FC<AIChatProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: t('aiChat.welcome', 'Hello! I\'m your AI assistant. How can I help you today?'),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      image: imagePreview,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    removeSelectedImage();
    setIsLoading(true);

    // Simulate AI response (replace with actual AI service call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(newMessage),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  // Simulate AI responses (replace with actual AI service)
  const generateAIResponse = (userMessage: Message): string => {
    const responses = [
      t('aiChat.responses.help', 'I understand you need assistance. Could you provide more details?'),
      t('aiChat.responses.image', 'I can see the image you uploaded. Let me analyze it for you.'),
      t('aiChat.responses.general', 'That\'s an interesting question. Let me help you with that.'),
      t('aiChat.responses.medical', 'For medical-related queries, I can provide general information, but please consult with a healthcare professional for specific advice.'),
    ];

    if (userMessage.image) {
      return responses[1];
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300 relative"
        >
          {/* Medical Cross Icon */}
          <div className="relative w-6 h-6">
            <div className="absolute top-1 left-2.5 w-1 h-4 bg-white rounded-sm"></div>
            <div className="absolute top-2.5 left-1 w-4 h-1 bg-white rounded-sm"></div>
          </div>
          {/* Small pulse indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-600 text-white rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center relative">
              {/* Medical Cross Icon in header */}
              <div className="relative w-5 h-5">
                <div className="absolute top-1 left-2 w-1 h-3 bg-white rounded-sm"></div>
                <div className="absolute top-2 left-1 w-3 h-1 bg-white rounded-sm"></div>
              </div>
            </div>
            <h3 className="font-medium">{t('aiChat.title', 'Medical AI Assistant')}</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.isUser
                    ? 'bg-red-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Uploaded"
                    className="rounded-lg mb-2 max-w-full h-auto"
                  />
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className={`text-xs opacity-70 mt-1 block ${
                  message.isUser ? 'text-red-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-none p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-20 max-h-20 rounded-lg border border-gray-200"
              />
              <button
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-red-600 transition-colors p-2"
              title={t('aiChat.uploadImage', 'Upload medical image')}
            >
              <PhotoIcon className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('aiChat.placeholder', 'Ask about symptoms, medications, or upload medical images...')}
                className="w-full resize-none border border-gray-300 rounded-xl px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent max-h-[120px] min-h-[40px]"
                rows={1}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!inputText.trim() && !selectedImage}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl p-2 transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
