import { Module } from '@nestjs/common';
import { ThriftService } from './thrift.service';

@Module({
  providers: [ThriftService],
  exports: [ThriftService],
})
export class ThriftModule {}
