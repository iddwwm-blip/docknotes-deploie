import { Request, Response, NextFunction } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "@/lib/auth"

declare global {
    namespace Express{
        interface Request {
            userId?: string;
        }
    }
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if(!session?.user?.id){
            res.status(401).json({message : "Non authentifié"});
            return
        }

        req.userId = session.user.id;
        next()
    } catch (error) {
        res.status(401).json({message : "Non authentifié"})
    }
}

