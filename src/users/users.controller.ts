import { Body, Controller, Delete, Get, Post, Query } from "@nestjs/common";
import type { usersTable } from "../../drizzle/schema";
import { SearchUsersParams, UsersService } from "./users.service";

@Controller("users")
export class UsersController {
	constructor(private readonly users: UsersService) {}

	@Post("create")
	createUser(@Body() user: typeof usersTable.$inferInsert) {
		return this.users.createUser(user);
	}

	@Get("search")
	searchUsers(
		@Query("keyword") keyword?: string,
		@Query("page") page?: string,
		@Query("pageSize") pageSize?: string,
	) {
		const params: SearchUsersParams = {
			keyword,
			page: page ? parseInt(page, 10) : 1,
			pageSize: pageSize ? parseInt(pageSize, 10) : 50,
		};

		return this.users.searchUsers(params);
	}

	@Delete("delete")
	deleteUser(@Body("userId") userId: string) {
		return this.users.deleteUser(userId);
	}
}
