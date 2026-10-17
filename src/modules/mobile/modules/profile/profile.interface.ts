/** Contract with the app (hajji-guide docs/router-voice.md §4). */
export interface GroupVoiceDto {
  member_id: string;
  /** base64, 32 random bytes. Secret. */
  key: string;
  key_version: number;
}

export interface UserProfile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  phone: string | null;
  pinfl: string | null;
  email: string | null;
  avatar_url: string | null;
  language: string;
  is_guide: boolean;
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
  agency?: {
    id?: string;
    name?: string;
  } | null;
  group_id?: string | null;
  group?: {
    id?: string;
    name?: string;
    departure_date?: Date | string | null;
    return_date?: Date | string | null;
    meeting_point?: string | null;
    status?: string | null;
    guide_name?: string | null;
    guide_phone?: string | null;
    /**
     * "Router orqali" group voice key — only in GET /mobile/profile, only for a member of this group.
     * `member_id` is the pilgrim id used by GET /mobile/plans/members.
     */
    voice?: GroupVoiceDto;
  } | null;
}

export interface UserProfileSettings {
  notifications_enabled: boolean;
  elderly_mode: boolean;
  language: string;
  theme: string;
}

