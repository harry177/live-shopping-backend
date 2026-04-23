import { Request, Response } from "express";
import { z } from "zod";
import { getMe, login } from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginController(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }

  const result = await login(parsed.data);

  if (!result) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  return res.status(200).json(result);
}

export async function meController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const user = await getMe(req.user.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json({
    user,
  });
}
