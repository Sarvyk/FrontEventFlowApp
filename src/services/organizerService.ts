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

export type OrganizerRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface OrganizerRequestDto {
  id: string;
  userId: string;
  userName: string;
  status: number;
  data: any;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface OrganizerListResponse {
  items: OrganizerRequestDto[];
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
    const response = await api.post<OrganizerResponse>('/Organizer/request', command);
    return response.data;
  },

  // Получить все заявки на организатора (только для Admin) с пагинацией
  getAllApplications: async (offset: number = 0, count: number = 10): Promise<OrganizerListResponse> => {
    const response = await api.get<{ items: OrganizerRequestDto[]; totalCount: number }>('/admin/Organizer', { params: { offset, count } });
    return {
      items: response.data.items ?? [],
      totalCount: response.data.totalCount ?? 0
    };
  },

  // Обновить статус заявки на организатора (только для Admin)
  updateApplicationStatus: async (id: string, status: 'Pending' | 'Approved' | 'Rejected', reason?: string): Promise<OrganizerRequestDto> => {
    const response = await api.put<OrganizerRequestDto>(`/admin/Organizer/${id}`, { status, reason });
    return response.data;
  },

  // Одобрить заявку (только для Admin)
  approveOrganizer: async (id: string): Promise<void> => {
    await api.patch(`/admin/Organizer/${id}/approve`);
  },

  // Отклонить заявку с причиной (только для Admin)
  rejectOrganizer: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/admin/Organizer/${id}/reject`, { data: reason });
  },
};