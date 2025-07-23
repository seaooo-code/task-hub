import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DutiesService } from './duties.service';
import { CreateDutyDto } from './dto/create-duty.dto';
import { SearchDutyDto } from './dto/search-duty.dto';
import { SwitchStatusDto } from './dto/switch-status.dto';
import { UpdateDutyDto } from './dto/update-duty.dto';
import { IdParamDto } from './dto/id-param.dto';

@Controller('duties')
export class DutiesController {
  constructor(private readonly duty: DutiesService) {}

  /**
   * 创建计划
   * @param body
   */
  @Post('create')
  create(@Body() body: CreateDutyDto) {
    return this.duty.createDuty(body);
  }

  /**
   * 搜索计划
   * @param keyword
   * @param page
   * @param pageSize
   */
  @Get('search')
  search(@Query('keyword') { keyword, page, pageSize }: SearchDutyDto) {
    return this.duty.searchDuties({
      keyword,
      page: page || 1,
      pageSize: pageSize || 50,
    });
  }

  /**
   * 删除计划
   * @param id
   */
  @Delete('delete')
  deleteDuty(@Body() { id }: IdParamDto) {
    return this.duty.deleteDuty(id);
  }

  /**
   * 修改计划状态
   * @param status
   * @param id
   */
  @Patch('switch-status')
  switchStatus(@Body() { status, id }: SwitchStatusDto) {
    return this.duty.switchStatus(id, status);
  }

  /**
   * 手动运行计划
   * @param id
   */
  @Post('run')
  manulRun(@Body() { id }: IdParamDto) {
    return this.duty.manualRunDuty(id);
  }

  /**
   * 更新计划
   * @param duty
   */
  @Put('update')
  update(@Body() duty: UpdateDutyDto) {
    return this.duty.updateDuty(duty.id, duty);
  }

  @Get(':id')
  getDutyDetail(@Param('id') { id }: IdParamDto) {
    return this.duty.getDutyDetail(id);
  }
}
