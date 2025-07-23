import { Test, TestingModule } from '@nestjs/testing';
import { DutiesService } from './duties.service';

describe('DutiesService', () => {
  let service: DutiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DutiesService],
    }).compile();

    service = module.get<DutiesService>(DutiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
