"use client";

import { ShieldX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessDeniedProps {
  message?: string;
}

export function AccessDenied({ message = "You don't have permission to access this page." }: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          {message}
        </CardContent>
      </Card>
    </div>
  );
}
