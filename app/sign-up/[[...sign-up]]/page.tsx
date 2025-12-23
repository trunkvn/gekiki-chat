import { SignUp, SignedOut } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen w-full bg-zinc-950 items-center justify-center">
      <SignedOut>
        <SignUp forceRedirectUrl="/" fallbackRedirectUrl="/" />
      </SignedOut>
    </div>
  );
}
