import { useState } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useDemoData } from "@/hooks/useDemoData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, User, Bell, Shield, Sparkles, Trash2, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { currentFacility } = useFacilities();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [clearingData, setClearingData] = useState(false);
  const { demoLoaded, loadDemoData, clearDemoData } = useDemoData();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and facility preferences
        </p>
      </div>

      {/* Facility Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-foreground">Facility Information</CardTitle>
          </div>
          <CardDescription>
            Update details for {currentFacility?.name || "your facility"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facility-name" className="text-foreground">Facility Name</Label>
              <Input 
                id="facility-name" 
                defaultValue={currentFacility?.name || ""} 
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-address" className="text-foreground">Address</Label>
              <Input 
                id="facility-address" 
                defaultValue={currentFacility?.address || ""} 
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-city" className="text-foreground">City</Label>
              <Input 
                id="facility-city" 
                defaultValue={currentFacility?.city || ""} 
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-state" className="text-foreground">State</Label>
              <Input 
                id="facility-state" 
                defaultValue={currentFacility?.state || ""} 
                className="text-foreground"
              />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-foreground">Account</CardTitle>
          </div>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              defaultValue={user?.email || ""} 
              disabled 
              className="text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-foreground">Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you receive compliance alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification settings coming soon. You'll be able to configure email alerts for 
            upcoming deadlines, overdue items, and document review reminders.
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-foreground">Security</CardTitle>
          </div>
          <CardDescription>
            Manage your security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      {/* Admin Tools - Only visible to admins */}
      {!adminLoading && isAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg text-foreground">Admin Tools</CardTitle>
            </div>
            <CardDescription>
              Administrative functions for testing and demo purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* In-Memory Demo Data */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">In-Memory Demo Data</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Load sample compliance data to explore app features, or clear it to start fresh.
              </p>
              <div className="flex flex-wrap gap-2">
                {!demoLoaded ? (
                  <Button onClick={loadDemoData} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Load Demo Data
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearDemoData} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear Demo Data
                  </Button>
                )}
              </div>
            </div>

            {/* Clear Database Data */}
            {currentFacility && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Clear Facility Data
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Permanently delete all tasks, evidence items, documents, and export packets for "{currentFacility.name}". This cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!currentFacility?.id) return;
                    
                    const confirmed = window.confirm(
                      `Are you sure you want to delete ALL data for "${currentFacility.name}"? This includes all tasks, evidence items, documents, and export packets. This action cannot be undone.`
                    );
                    
                    if (!confirmed) return;
                    
                    setClearingData(true);
                    try {
                      // Delete in order to respect potential foreign keys
                      const { error: tasksError } = await supabase
                        .from("tasks")
                        .delete()
                        .eq("facility_id", currentFacility.id);
                      if (tasksError) throw tasksError;

                      const { error: docsError } = await supabase
                        .from("documents")
                        .delete()
                        .eq("facility_id", currentFacility.id);
                      if (docsError) throw docsError;

                      const { error: evidenceError } = await supabase
                        .from("evidence_items")
                        .delete()
                        .eq("facility_id", currentFacility.id);
                      if (evidenceError) throw evidenceError;

                      const { error: packetsError } = await supabase
                        .from("export_packets")
                        .delete()
                        .eq("facility_id", currentFacility.id);
                      if (packetsError) throw packetsError;

                      toast.success("All facility data cleared successfully");
                    } catch (error: any) {
                      console.error("Error clearing data:", error);
                      toast.error(error.message || "Failed to clear data");
                    } finally {
                      setClearingData(false);
                    }
                  }}
                  disabled={clearingData}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {clearingData ? "Clearing..." : "Clear All Facility Data"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
