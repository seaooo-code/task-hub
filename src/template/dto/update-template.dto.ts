import {
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUrl,
} from "class-validator";

export class UpdateTemplateDto {
	@IsString()
	@IsNotEmpty({ message: "模板id不能为空" })
	id: string;
	@IsOptional()
	@IsString()
	@IsNotEmpty({ message: "模板名称不能为空" })
	name?: string;

	@IsOptional()
	@IsString()
	@IsUrl({}, { message: "图片地址必须是有效的URL" })
	@IsNotEmpty({ message: "图片地址不能为空" })
	imageUrl?: string;

	@IsOptional()
	@IsObject({ message: "变量必须是对象格式" })
	vars?: Record<string, any>;
}
