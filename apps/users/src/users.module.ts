import { ApolloFederationDriver, ApolloFederationDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";

// services
import { PrismaService } from "../../../prisma/prisma.service";
import { EmailService } from "./email/email.service";
import { UsersService } from "./users.service";

// resolvers
import { UsersResolver } from "./users.resolver";

// modules
import { EmailModule } from "./email/email.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        GraphQLModule.forRoot<ApolloFederationDriverConfig>({
            driver: ApolloFederationDriver,
            autoSchemaFile: {
                federation: 2,
            },
        }),
        EmailModule,
    ],
    controllers: [],
    providers: [UsersService, ConfigService, JwtService, PrismaService, UsersResolver, EmailService],
})
export class UsersModule {}
