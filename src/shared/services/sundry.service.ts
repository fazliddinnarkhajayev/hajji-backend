import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class SundryService {
  generateHashPassword(password: string): string {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  compareHashPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }
}
