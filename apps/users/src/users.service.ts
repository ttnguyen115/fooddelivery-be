import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { type Response } from "express";

// services
import { PrismaService } from "../../../prisma/prisma.service";
import { EmailService } from "./email/email.service";

// DTOs
import { ActivationDTO, LoginDTO, RegisterDTO } from "./dtos/user.dto";

interface UserData {
    name: string;
    email: string;
    password: string;
    phone_number: number;
}

@Injectable()
export class UsersService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService
    ) {}

    async register(registerDTO: RegisterDTO, response: Response) {
        const { name, email, password, phone_number } = registerDTO;

        const isEmailExist = await this.prismaService.user.findUnique({
            where: { email },
        });
        if (isEmailExist) {
            throw new BadGatewayException("User already exists with this email!");
        }

        const isPhoneNumberExist = await this.prismaService.user.findUnique({
            where: { phone_number },
        });
        if (isPhoneNumberExist) {
            throw new BadGatewayException("User already exists with this phone number!");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            ...registerDTO,
            password: hashedPassword,
        };

        const { token, activationCode } = await this.createActivationToken(user);

        await this.emailService.sendMail({
            email,
            name,
            subject: "Activate your account!",
            template: "./activation-mail",
            activationCode: activationCode,
        });

        return { activation_token: token, response };
    }

    async login(loginDTO: LoginDTO) {
        const { email, password } = loginDTO;
        const user = { email, password };
        return user;
    }

    async getUsers() {
        return this.prismaService.user.findMany({});
    }

    async createActivationToken(user: UserData) {
        const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const token = this.jwtService.sign(
            {
                user,
                activationCode,
            },
            {
                secret: this.configService.get<string>("ACTIVATION_SECRET"),
                expiresIn: "5m",
            }
        );

        return { token, activationCode };
    }

    async activateUser(activationDTO: ActivationDTO, response: Response) {
        const { activationCode, activationToken } = activationDTO;
        const newUser: { user: UserData; activationCode: string } = this.jwtService.verify(activationToken, {
            secret: this.configService.get<string>("ACTIVATION_SECRET"),
        });

        if (newUser.activationCode !== activationCode) {
            throw new BadRequestException("Invalid activation code");
        }

        const { name, email, password, phone_number } = newUser.user;

        const existUser = await this.prismaService.user.findUnique({
            where: { email },
        });
        if (existUser) {
            throw new BadRequestException("User already exists with this email!");
        }

        const user = await this.prismaService.user.create({
            data: {
                name,
                email,
                password,
                phone_number,
            },
        });

        return { user, response };
    }
}
