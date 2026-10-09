import { apiClient } from './apiClient';
import { ChatChannel, ChatMessage, SendMessageDto } from '../types/communication';
import { StaffUser } from '../types/auth';

export const chatService = {
  /**
   * Create an internal clinical or departmental chat channel
   */
  async createChannel(name: string, description?: string): Promise<ChatChannel> {
    return await apiClient.post('/chat/channels', { name, description });
  },

  /**
   * Retrieve all active internal staff chat channels
   */
  async getChannels(): Promise<ChatChannel[]> {
    return await apiClient.get('/chat/channels');
  },

  /**
   * Retrieve list of hospital staff available for 1-on-1 Direct Messaging
   */
  async getStaffList(): Promise<StaffUser[]> {
    return await apiClient.get('/chat/staff');
  },

  /**
   * Post an instant message to a channel or DM
   */
  async sendMessage(dto: SendMessageDto): Promise<ChatMessage> {
    return await apiClient.post('/chat/messages', dto);
  },

  /**
   * Retrieve messages for a channel
   */
  async getMessages(channel: string, limit = 100): Promise<ChatMessage[]> {
    return await apiClient.get('/chat/messages', { params: { channel, limit } });
  },
};

export default chatService;
