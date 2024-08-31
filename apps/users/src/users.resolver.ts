import { BadRequestException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { type Request, type Response } from "express";

// services
import { UsersService } from "./users.service";

// dtos
import { ActivationDTO, RegisterDTO } from "./dtos/user.dto";

// entities
import { User } from "./entities/user.entity";

// types
import { ActivationResponse, LoginResponse, LogoutResponse, RegisterResponse } from "./types/user.type";

// guard
import { AuthGuard } from "./guards/auth.guard";

@Resolver("User")
export class UsersResolver {
    constructor(private readonly userService: UsersService) {}

    @Mutation(() => RegisterResponse)
    async register(
        @Args("registerDTO") registerDTO: RegisterDTO,
        @Context() context: { res: Response }
    ): Promise<RegisterResponse> {
        const { name, email, password } = registerDTO;

        if (!name || !email || !password) {
            throw new BadRequestException("Please fill the all fields");
        }

        const { activation_token } = await this.userService.register(registerDTO, context.res);

        return { activation_token };
    }

    @Mutation(() => ActivationResponse)
    async activateUser(
        @Args("activationDTO") activationDTO: ActivationDTO,
        @Context() context: { res: Response }
    ): Promise<ActivationResponse> {
        return await this.userService.activateUser(activationDTO, context.res);
    }

    @Mutation(() => LoginResponse)
    async login(@Args("email") email: string, @Args("password") password: string): Promise<LoginResponse> {
        return this.userService.login({ email, password });
    }

    @Query(() => LoginResponse)
    @UseGuards(AuthGuard)
    async getLoggedInUser(@Context() context: { req: Request }): Promise<LoginResponse> {
        return await this.userService.getLoggedInUser(context.req);
    }

    @Query(() => LogoutResponse)
    @UseGuards(AuthGuard)
    async logoutUser(@Context() context: { req: Request }): Promise<LogoutResponse> {
        return await this.userService.logout(context.req);
    }

    @Query(() => [User])
    async getUsers() {
        return this.userService.getUsers();
    }
}
