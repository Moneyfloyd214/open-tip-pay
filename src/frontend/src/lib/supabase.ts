import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebase";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    accessToken: async () => {
      const token = await auth.currentUser?.getIdToken();
      return token ?? null;
    },
  },
);
