import api from './api';

export interface OrganizerApplication {
  companyName: string;
  description: string;
  webSite: string;
}

export interface OrganizerResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

export const organizerService = {
  // Получить свою заявку на организатора
  getMyApplication: async (): Promise<OrganizerResponse> => {
    const response = await api.get('/Organizer/my');
    return response.data;
  },
  
  // Создать новую заявку на организатора
  createApplication: async (command: OrganizerApplication): Promise<OrganizerResponse> => {
    const response = await api.post<OrganizerResponse>('/Organizer', command);
    return response.data;
  },
};