import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-neutral-0 p-8 shadow-card-lg">
        <Outlet />
      </div>
    </div>
  );
}
