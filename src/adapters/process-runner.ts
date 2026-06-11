import { spawn } from 'node:child_process';

export class ProcessRunner {
  run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        env,
        stdio: 'inherit',
      });

      child.on('error', reject);
      child.on('exit', (code) => {
        resolve(code ?? 0);
      });
    });
  }
}
