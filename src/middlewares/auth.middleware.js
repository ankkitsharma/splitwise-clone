import JwtService from "../services/jwt.service";
import { BadTokenError, UnauthorizedError } from "../utils/ApiError";

function parseHeaderUserId(req) {
  const raw = req.headers["x-user-id"];
  if (raw === undefined || raw === "") return undefined;
  const id = parseInt(String(raw), 10);
  if (Number.isNaN(id)) return NaN;
  return id;
}

/**
 * Resolves `req.userId` from `X-User-Id` (assignment mode) or JWT when enabled.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const headerId = parseHeaderUserId(req);
    if (headerId !== undefined && !Number.isNaN(headerId)) {
      req.userId = headerId;
      return next();
    }
    if (Number.isNaN(headerId)) {
      return next(new UnauthorizedError("Invalid X-User-Id"));
    }
    if (process.env.SERVER_JWT === "false") {
      return next(new UnauthorizedError());
    }

    const token = JwtService.jwtGetToken(req);
    const decoded = JwtService.jwtVerify(token);
    req.userId = decoded;

    return next();
  } catch (error) {
    next(new BadTokenError());
  }
};

export default authMiddleware;
