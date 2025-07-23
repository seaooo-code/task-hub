/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as thrift from 'thrift';
import * as KeycenterAgent from './KeycenterAgent';

@Injectable()
export class ThriftService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ThriftService.name);
  private connection: any;
  private client: any;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  /**
   * 连接到 Thrift 服务器
   */
  connect(): void {
    try {
      const host = this.configService.get<string>(
        'THRIFT_HOST',
        'kcagent.sec.xiaomi.com',
      );
      const port = this.configService.get<number>('THRIFT_PORT', 9988);

      console.log(`Connecting to Thrift server at ${host}:${port}`);

      // 创建连接
      const connection = thrift.createConnection(host, port, {
        transport: thrift.TFramedTransport,
        protocol: thrift.TCompactProtocol,
      });
      // 监听连接事件
      connection.on('connect', function () {
        const client = thrift.createClient(KeycenterAgent.Client, connection);
        const plaintext = 'this is a test';
        console.log('plaintext: ' + plaintext);
        client
          .encrypt('feishu', plaintext, '', 0)
          .then((buffer) => {
            const cipher = buffer.toString('base64');
            console.log('cipher(base64):' + cipher);
            client.decrypt(
              'feishu',
              Buffer.from(cipher, 'base64'),
              '',
              0,
              (err, buffer) => {
                if (!err) {
                  console.log('decrypt success: ' + buffer.toString('utf-8'));
                }
                connection.destroy();
              },
            );
          })
          .catch((err) => {
            console.log(err);
          });
      });

      // this.connection.on('error', (error: Error) => {
      //   this.logger.error('❌ Thrift connection error:', error);
      //   this.isConnected = false;
      // });
      //
      // this.connection.on('close', () => {
      //   this.logger.warn('⚠️ Thrift connection closed');
      //   this.isConnected = false;
      // });
    } catch (error) {
      this.logger.error('Failed to connect to Thrift server:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.connection) {
      this.connection.end();
      this.connection = null;
      this.client = null;
      this.isConnected = false;
      console.log('🔌 Disconnected from Thrift server');
    }
  }

  /**
   * 重新连接
   */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /**
   * 检查连接状态
   */
  getConnectionStatus(): { connected: boolean; host?: string; port?: number } {
    return {
      connected: this.isConnected,
      host: this.configService.get<string>('THRIFT_HOST', 'localhost'),
      port: this.configService.get<number>('THRIFT_PORT', 9988),
    };
  }

  /**
   * 获取客户端
   */
  getClient(): any {
    if (!this.isConnected || !this.client) {
      throw new Error('Thrift client is not available');
    }
    return this.client;
  }

  /**
   * 执行 Thrift 调用（通用方法）
   */
  async call<T>(method: string, args: any): Promise<T> {
    if (!this.isConnected || !this.client) {
      throw new Error('Thrift client is not connected');
    }

    return new Promise((resolve, reject) => {
      this.client?.[method]?.(args, (error: Error, result: T) => {
        if (error) {
          this.logger.error(`Thrift call failed: ${method}`, error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Keycenter 业务方法
  async hsmPickKeyPair(sid: string): Promise<any> {
    return this.call('hsmPickKeyPair', { sid });
  }

  async hsmGetPublicKey(sid: string): Promise<any> {
    return this.call('hsmGetPublicKey', { sid });
  }

  async hsmSign(sid: string, data: string): Promise<any> {
    return this.call('hsmSign', { sid, data });
  }

  async hsmSecretKeyEncrypt(sid: string, data: string): Promise<any> {
    return this.call('hsmSecretKeyEncrypt', { sid, data });
  }

  async hsmSecretKeyDecrypt(sid: string, encryptedData: string): Promise<any> {
    return this.call('hsmSecretKeyDecrypt', { sid, encryptedData });
  }

  async hsmPrivateKeyDecrypt(sid: string, encryptedData: string): Promise<any> {
    return this.call('hsmPrivateKeyDecrypt', { sid, encryptedData });
  }
}
