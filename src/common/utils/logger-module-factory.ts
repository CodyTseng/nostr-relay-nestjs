import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { TransportTargetOptions } from 'pino';
import { Config } from '../../config';

export function loggerModuleFactory(
  configService: ConfigService<Config, true>,
) {
  const { dir, level } = configService.get('logger', { infer: true });
  const environment = configService.get('environment', { infer: true });
  const targets: TransportTargetOptions[] = [];
  if (dir) {
    const dirStat = statSync(dir);
    if (!dirStat) {
      fs.mkdirSync(dir, { recursive: true });
    } else if (!dirStat.isDirectory()) {
      throw new Error(`Log directory '${dir}' is not a directory`);
    }

    targets.push({
      level,
      target: 'pino/file',
      options: { destination: path.join(dir, 'common.log') },
    });
  }

  // if (environment !== 'production') {
    targets.push({ level, target: 'pino/file', options: { destination: 1 } });
  // }
  return {
    pinoHttp: {
      transport: {
        targets,
      },
    },
  };
}

function statSync(dirPath: string) {
  try {
    return fs.statSync(dirPath);
  } catch {
    return false;
  }
}
