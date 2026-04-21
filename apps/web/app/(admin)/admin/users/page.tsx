'use client';

import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">List, filter, and manage user accounts</p>
          </div>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground py-12">
          User data table implementation pending API hook connection.
        </CardContent>
      </Card>
    </div>
  );
}
