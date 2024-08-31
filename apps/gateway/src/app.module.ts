import { IntrospectAndCompose } from "@apollo/gateway";
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";

// services
import { AppService } from "./app.service";

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
            driver: ApolloGatewayDriver,
            gateway: {
                supergraphSdl: new IntrospectAndCompose({
                    subgraphs: [],
                }),
            },
        }),
    ],
    controllers: [],
    providers: [AppService],
})
export class AppModule {}
