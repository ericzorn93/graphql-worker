import { Token } from 'typedi';

export const EnvToken: Token<Env> = new Token<Env>('env');
