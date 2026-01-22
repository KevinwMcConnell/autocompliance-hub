import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Shield, Building2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface FacilityData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  license_number: string;
  has_hazardous_waste: boolean;
  has_paint_booth: boolean;
  has_underground_tanks: boolean;
  has_air_compressor: boolean;
  has_lift_equipment: boolean;
  has_fire_suppression: boolean;
  has_stormwater_discharge: boolean;
  has_refrigerant_handling: boolean;
  has_osha_safety_program: boolean;
  employee_count: number;
}

const questions = [
  { key: "has_hazardous_waste", label: "Do you generate or handle hazardous waste?", description: "Including used oil, solvents, antifreeze, batteries" },
  { key: "has_paint_booth", label: "Do you have a paint booth or spray area?", description: "For body work, touch-ups, or refinishing" },
  { key: "has_underground_tanks", label: "Do you have underground storage tanks?", description: "For fuel, oil, or other fluids" },
  { key: "has_air_compressor", label: "Do you have air compressors?", description: "Pressure vessels over 15 PSI" },
  { key: "has_lift_equipment", label: "Do you use automotive lifts?", description: "Two-post, four-post, or scissor lifts" },
  { key: "has_fire_suppression", label: "Do you have fire suppression systems?", description: "Sprinklers, hood systems, or extinguisher stations" },
  { key: "has_stormwater_discharge", label: "Do you have stormwater discharge?", description: "Floor drains, outdoor wash areas, runoff" },
  { key: "has_refrigerant_handling", label: "Do you handle refrigerants (A/C service)?", description: "Automotive A/C repair or recharge" },
  { key: "has_osha_safety_program", label: "Do you have a written safety program?", description: "OSHA-required safety and health program" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useFacilities();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [facilityData, setFacilityData] = useState<FacilityData>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    license_number: "",
    has_hazardous_waste: false,
    has_paint_booth: false,
    has_underground_tanks: false,
    has_air_compressor: false,
    has_lift_equipment: false,
    has_fire_suppression: false,
    has_stormwater_discharge: false,
    has_refrigerant_handling: false,
    has_osha_safety_program: false,
    employee_count: 1,
  });

  const totalSteps = 3; // Basic info, gating questions, employee count
  const progress = ((step + 1) / totalSteps) * 100;

  const updateField = (key: keyof FacilityData, value: string | boolean | number) => {
    setFacilityData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from("facilities").insert({
      user_id: user.id,
      ...facilityData,
      onboarding_completed: true,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to create facility: " + error.message);
    } else {
      toast.success("Facility created successfully!");
      await refetch();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">ComplianceHub</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Setting up your facility</span>
            <span className="text-sm text-muted-foreground">Step {step + 1} of {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          {step === 0 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Tell us about your facility</CardTitle>
                <CardDescription>
                  We'll use this information to set up your compliance profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Facility Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Main Street Auto Repair"
                      value={facilityData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      value={facilityData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={facilityData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="CA"
                        value={facilityData.state}
                        onChange={(e) => updateField("state", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        placeholder="12345"
                        value={facilityData.zip_code}
                        onChange={(e) => updateField("zip_code", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={facilityData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facility-email">Email</Label>
                    <Input
                      id="facility-email"
                      type="email"
                      placeholder="contact@facility.com"
                      value={facilityData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="license">Business License Number</Label>
                    <Input
                      id="license"
                      placeholder="License number"
                      value={facilityData.license_number}
                      onChange={(e) => updateField("license_number", e.target.value)}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => setStep(1)}
                    disabled={!facilityData.name}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl">Compliance Profile Questions</CardTitle>
                <CardDescription>
                  These answers help us determine which compliance requirements apply to your facility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {questions.map((q) => (
                  <div
                    key={q.key}
                    className="flex items-start justify-between gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{q.label}</p>
                      <p className="text-sm text-muted-foreground">{q.description}</p>
                    </div>
                    <Switch
                      checked={facilityData[q.key as keyof FacilityData] as boolean}
                      onCheckedChange={(checked) => updateField(q.key as keyof FacilityData, checked)}
                    />
                  </div>
                ))}
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(2)}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="p-3 bg-status-ok/10 rounded-xl w-fit mb-4">
                  <CheckCircle2 className="h-6 w-6 text-status-ok" />
                </div>
                <CardTitle className="text-2xl">Almost done!</CardTitle>
                <CardDescription>
                  Just one more question to complete your facility setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="employees">How many employees work at this facility?</Label>
                  <Input
                    id="employees"
                    type="number"
                    min={1}
                    value={facilityData.employee_count}
                    onChange={(e) => updateField("employee_count", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>{facilityData.name}</strong>
                    {facilityData.city && facilityData.state && ` • ${facilityData.city}, ${facilityData.state}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Object.entries(facilityData).filter(([k, v]) => k.startsWith("has_") && v === true).length} compliance areas identified
                  </p>
                </div>
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Complete Setup"}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
