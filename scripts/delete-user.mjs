import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.log("Not found (already gone):", email);
  process.exit(0);
}
const { error } = await admin.auth.admin.deleteUser(user.id);
console.log(error ? "delete error: " + error.message : "Deleted: " + email);
