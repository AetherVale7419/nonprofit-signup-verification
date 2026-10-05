import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

// canonical capability: auth.user.create

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1),
  campaign: z.string().min(1)
});
export type SignupInput = z.infer<typeof signupSchema>;

type User = { user_id: string };
type Session = { session_id: string };
type SentMessage = { message_id: string };

export async function signupAndSendVerification(input: unknown, client: InfraiClient) {
  const signup = signupSchema.parse(input);
  const user = await client.request<User>("POST", "/v1/auth/user/create", {
    email: signup.email,
    password: signup.password,
    name: signup.name,
    metadata: { campaign: signup.campaign },
    vendor: "infrai",
    mode: "signup",
    idempotency_key: `signup:${signup.email.toLowerCase()}`
  });
  const session = await client.request<Session>("POST", "/v1/auth/session/create", {
    user_id: user.user_id,
    method: "email",
    require_mfa: false
  });
  const message = await client.request<SentMessage>("POST", "/v1/email/send", {
    to: signup.email,
    subject: "Confirm your nonprofit account",
    body: `Hi ${signup.name}, confirm your account with session ${session.session_id}.`,
  });
  return { userId: user.user_id, sessionId: session.session_id, messageId: message.message_id, campaign: signup.campaign };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const input = { email: process.env.SIGNUP_EMAIL ?? "donor@example.org", password: process.env.SIGNUP_PASSWORD ?? "change-this-password", name: process.env.SIGNUP_NAME ?? "Sample donor", campaign: process.env.CAMPAIGN ?? "spring-relief" };
  signupAndSendVerification(input, new InfraiClient(key)).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
