import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { TransportTargetOptions } from 'pino';
import { Config } from '../../config';

export function loggerModuleFactory(
  configService: ConfigService<Config, true>,
) {
  const { dir, level } = configService.get('logger', { infer: true });
  const targets: TransportTargetOptions[] = [];
  if (dir) {
    targets.push({
      level,
      target: 'pino/file',
      options: { destination: path.join(dir, 'common.log') },
    });
  }
  targets.push({ level, target: 'pino/file', options: { destination: 1 } });
  return {
    pinoHttp: {
      transport: {
        targets,
      },
    },
  };
}
