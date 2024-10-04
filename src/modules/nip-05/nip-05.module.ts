import { Module } from '@nestjs/common';
import { Nip05Controller } from './nip-05.controller';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  controllers: [Nip05Controller],
})
export class Nip05Module {}
