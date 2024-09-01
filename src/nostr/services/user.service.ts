import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  new(pubkey: string, admissionFee: number) {
    return this.userRepository.upsert(pubkey, admissionFee);
  }

  async isEligible(pubkey: string): Promise<boolean> {
    const ex = await this.userRepository.findExpireAt(pubkey);
    return ex && ex >= new Date() ? true : false;
  }
}
