import assert from "node:assert/strict";
import { signupAndSendVerification } from "../src/signup_service.ts";

class FakeClient {
  calls: Array<{ method: string; path: string; body: any }> = [];
  async request<T>(method: string, path: string, body: any): Promise<T> {
    this.calls.push({ method, path, body });
    if (path === "/v1/auth/user/create") return { user_id: "u-1" } as T;
    if (path === "/v1/auth/session/create") return { session_id: "s-1" } as T;
    return { message_id: "m-1" } as T;
  }
}

const client = new FakeClient();
const result = await signupAndSendVerification({ email: "person@example.org", password: "long-enough-password", name: "A donor", campaign: "winter" }, client as any);
assert.deepEqual(result, { userId: "u-1", sessionId: "s-1", messageId: "m-1", campaign: "winter" });
assert.equal(client.calls[1].body.user_id, "u-1");
assert.equal(client.calls[2].body.to, "person@example.org");
assert.equal(client.calls[2].body.body, "Hi A donor, confirm your account with session s-1.");
assert.equal("text" in client.calls[2].body, false);
await assert.rejects(() => signupAndSendVerification({ email: "bad", password: "short", name: "", campaign: "winter" }, client as any));
console.log("signup decision test passed");
