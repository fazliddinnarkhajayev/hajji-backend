import { UserTypesEnum } from "src/shared/enums/user-types.enum";

export interface Users {
  id: string;
  username: string;
  password_hash: string | null;
  type: UserTypesEnum;
  created_by_id: string | null;
  created_at: Date;
}
