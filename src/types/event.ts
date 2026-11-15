export interface EventDto {
  id: string;
  title: string;
  description: string;
  type: string;
  start: string;
  end: string;
  city: string;
  address: string;
  price: number;
  maxParticipants: number;
  isPublished: boolean;
  createdAt: string;
}