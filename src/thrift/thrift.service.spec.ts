import { Test, TestingModule } from '@nestjs/testing';
import { ThriftService } from './thrift.service';

describe('ThriftService', () => {
  let service: ThriftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThriftService],
    }).compile();

    service = module.get<ThriftService>(ThriftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
