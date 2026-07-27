import { Redirect } from "expo-router";
import { useAppSelector } from "../src/hooks/useAppHooks";

// By the time this renders, the root layout's SessionGate has already
// resolved restoreSession(), so isAuthenticated here reflects the real,
// restored session state — not just whatever the initial Redux state was.
export default function Index() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return <Redirect href={isAuthenticated ? "/(app)/home" : "/(auth)/login"} />;
}
