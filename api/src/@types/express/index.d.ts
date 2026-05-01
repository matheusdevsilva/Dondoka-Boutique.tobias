import { JwtPayload } from "../../types/JwtPayload"

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}