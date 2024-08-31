import { BadRequestException } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { type Response } from "express";

// services
import { UsersService } from "./users.service";

// dtos
import { ActivationDTO, RegisterDTO } from "./dtos/user.dto";

// entities
import { User } from "./entities/user.entity";

// types
import { ActivationResponse, RegisterResponse } from "./types/user.type";

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

    @Query(() => [User])
    async getUsers() {
        return this.userService.getUsers();
    }
}
