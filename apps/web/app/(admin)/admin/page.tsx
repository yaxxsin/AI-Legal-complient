'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Shield, Database, LayoutDashboard } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <LayoutDashboard className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">Platform basic statistics and status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">54</div>
            <p className="text-xs text-muted-foreground">Active reference logic</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regulations DB</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">Indexed in Pinecone</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
