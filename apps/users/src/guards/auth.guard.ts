import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../../../prisma/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
        private readonly config: ConfigService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const gqlContext = GqlExecutionContext.create(context);
        const { req } = gqlContext.getContext();

        const accessToken = req.headers.accesstoken as string;
        const refreshToken = req.headers.refreshtoken as string;

        if (!accessToken || !refreshToken) {
            throw new UnauthorizedException("Please login to access this resource!");
        }

        if (accessToken) {
            const decoded = this.jwt.verify(accessToken, {
                secret: this.config.get<string>("ACCESS_TOKEN_SECRET"),
            });
            if (!decoded) {
                throw new UnauthorizedException("Invalid access token!");
            }

            await this.updateAccessToken(req);
        }

        return true;
    }

    private async updateAccessToken(req: any): Promise<void> {
        try {
            const refreshToken = req.headers.refreshtoken as string;
            const decoded = this.jwt.verify(refreshToken, {
                secret: this.config.get<string>("REFRESH_TOKEN_SECRET"),
            });
            if (!decoded) {
                throw new UnauthorizedException("Invalid refresh token!");
            }

            const user = await this.prisma.user.findUnique({
                where: { id: decoded.id },
            });

            const newAccessToken = this.jwt.sign(
                { id: user.id },
                {
                    secret: this.config.get<string>("ACCESS_TOKEN_SECRET"),
                    expiresIn: "15m",
                }
            );
            const newRefreshToken = this.jwt.sign(
                { id: user.id },
                {
                    secret: this.config.get<string>("REFRESH_TOKEN_SECRET"),
                    expiresIn: "7d",
                }
            );

            req.accesstoken = newAccessToken;
            req.refreshtoken = newRefreshToken;
            req.user = user;
        } catch (error: any) {
            console.log(error);
        }
    }
}
