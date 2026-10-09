import { useState, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';
import { ChatChannel, ChatMessage, SendMessageDto } from '../types/communication';
import { chatChannels } from '../constants/system';

export function useChat(activeChannelId = 'general') {
  const [channels, setChannels] = useState<ChatChannel[]>(chatChannels);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cData, mData] = await Promise.allSettled([
        chatService.getChannels(),
        chatService.getMessages(activeChannelId),
      ]);

      if (cData.status === 'fulfilled' && Array.isArray(cData.value) && cData.value.length > 0) {
        setChannels(cData.value);
      }
      if (mData.status === 'fulfilled' && Array.isArray(mData.value)) {
        setMessages(mData.value);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load chat data');
    } finally {
      setLoading(false);
    }
  }, [activeChannelId]);


  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  const postMessage = async (dto: SendMessageDto, senderId?: string, senderName?: string, senderRole?: string) => {
    let created: ChatMessage | null = null;
    try {
      const res = await chatService.sendMessage(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend send message failed, updating local state:', err);
    }

    const newMsg: ChatMessage = created || {
      id: `MSG-${String(messages.length + 1).padStart(3, '0')}`,
      channel: dto.channel,
      senderId: senderId || 'USR-001',
      senderName: senderName || 'Staff User',
      senderRole: senderRole || 'doctor',
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  return {
    channels,
    messages,
    loading,
    error,
    refetch: fetchChat,
    postMessage,
  };
}

export default useChat;
