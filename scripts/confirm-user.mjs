import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] || "admin@bedaie.com";

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Find the user by listing (admin) and confirm their email.
const { data: list, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listErr) {
  console.error("listUsers error:", listErr.message);
  process.exit(1);
}

const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error("User not found:", email);
  process.exit(1);
}

const { data: upd, error: updErr } = await admin.auth.admin.updateUserById(
  user.id,
  { email_confirm: true },
);
if (updErr) {
  console.error("updateUserById error:", updErr.message);
  process.exit(1);
}

console.log("OK confirmed:", upd.user.email, "| email_confirmed_at:", upd.user.email_confirmed_at);
