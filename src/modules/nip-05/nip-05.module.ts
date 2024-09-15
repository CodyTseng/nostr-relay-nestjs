import { Module } from '@nestjs/common';
import { Nip05Controller } from './nip-05.controller';

@Module({
  controllers: [Nip05Controller],
})
export class Nip05Module {}
