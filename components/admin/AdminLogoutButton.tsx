"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleLogout}
      isLoading={isLoading}
      leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
    >
      Sign out
    </Button>
  );
}
