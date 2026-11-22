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
  currentParticipants: number;
  availableSpots: number;
  status: string;
  imageUrl: string | null;
  organizerName: string;
  isPublished: boolean;
  isUserRegistered: boolean;
  createdAt: string;
}