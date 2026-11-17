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
  companyName?: string | null;
  description?: string | null;
  webSite?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerDto {
  id: string;
  userId: string;
  companyName: string | null;
  description: string | null;
  webSite: string | null;
  isVerified: boolean;
  isDelete: boolean;
  reason: string | null;
  eventsCount: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

export interface OrganizerListResponse {
  items: OrganizerDto[];
  totalCount: number;
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

  // Получить все заявки на организатора (только для Admin) с пагинацией
  getAllApplications: async (offset: number = 0, count: number = 10): Promise<{ items: OrganizerDto[]; totalCount: number }> => {
    const response = await api.get('/admin/Organizer', { params: { offset, count } });
    return response.data;
  },

  // Обновить статус заявки на организатора (только для Admin)
  updateApplicationStatus: async (id: string, isVerified: boolean, reason?: string): Promise<OrganizerDto> => {
    const response = await api.put<OrganizerDto>(`/admin/Organizer/${id}`, { isVerified, reason });
    return response.data;
  },
};