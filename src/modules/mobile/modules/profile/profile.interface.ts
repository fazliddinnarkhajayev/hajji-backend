export interface UserProfile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  language: string;
  user_id: string;
  status: string;
  notifications_enabled: boolean;
  elderly_mode: boolean;
  theme: string;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  // Joined data
    country?: {
    id?: string;
    name?: string;
    soato?: string;
  };
  region?: {
    id?: string;
    name?: string;
    soato?: string;
  };
  district?: {
    id?: string;
    name?: string;
    soato?: string;
  };
}

export interface UserProfileSettings {
  notifications_enabled: boolean;
  elderly_mode: boolean;
  language: string;
  theme: string;
}

