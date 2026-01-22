import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Shield, Building2, ArrowRight, ArrowLeft, CheckCircle2, Wrench, FlaskConical, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type FacilityType = "automotive" | "chemical" | "other";

interface FacilityData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  facility_type: FacilityType | "";
  // Automotive questions
  has_hazardous_waste: boolean | null;
  waste_shipment_frequency: string;
  generates_used_oil: boolean | null;
  used_oil_storage_gallons: string;
  has_parts_washer: boolean | null;
  parts_washer_vendor_serviced: boolean | null;
  has_spray_painting: boolean | null;
  has_underground_tanks: boolean | null;
  // Chemical questions
  stores_regulated_chemicals: boolean | null;
  sds_count_range: string;
  has_aboveground_tanks: boolean | null;
  has_floor_drains: boolean | null;
  has_air_emissions: boolean | null;
  generates_hazwaste: boolean | null;
}

const automotiveQuestions = [
  {
    key: "has_hazardous_waste",
    question: "Do you generate hazardous waste (solvents, paint waste, parts washer waste, oily absorbents)?",
    type: "yesNoNotSure",
  },
  {
    key: "waste_shipment_frequency",
    question: "How often do you ship waste off-site?",
    type: "select",
    options: ["Monthly", "Quarterly", "Yearly", "Not sure"],
  },
  {
    key: "generates_used_oil",
    question: "Do you generate used oil?",
    type: "yesNo",
  },
  {
    key: "used_oil_storage_gallons",
    question: "Approx total used-oil storage at any time?",
    type: "select",
    options: ["<55 gallons", "55–1,320 gallons", ">1,320 gallons", "Not sure"],
  },
  {
    key: "has_parts_washer",
    question: "Do you have a parts washer?",
    type: "yesNo",
  },
  {
    key: "parts_washer_vendor_serviced",
    question: "If yes, is it serviced by a vendor that removes waste?",
    type: "yesNoNotSure",
  },
  {
    key: "has_spray_painting",
    question: "Any spray painting / spray booth?",
    type: "yesNo",
  },
  {
    key: "has_underground_tanks",
    question: "Any underground storage tank (UST)?",
    type: "yesNoNotSure",
  },
];

const chemicalQuestions = [
  {
    key: "stores_regulated_chemicals",
    question: "Do you store regulated chemicals on-site?",
    type: "yesNoNotSure",
  },
  {
    key: "sds_count_range",
    question: "Approx number of SDS/chemical products?",
    type: "select",
    options: ["<25", "25–100", ">100", "Not sure"],
  },
  {
    key: "has_aboveground_tanks",
    question: "Any aboveground tanks?",
    type: "yesNoNotSure",
  },
  {
    key: "has_floor_drains",
    question: "Any discharges / floor drains / wash down?",
    type: "yesNoNotSure",
  },
  {
    key: "has_air_emissions",
    question: "Any air-emitting processes?",
    type: "yesNoNotSure",
  },
  {
    key: "generates_hazwaste",
    question: "Any hazardous waste generated?",
    type: "yesNoNotSure",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { facilities, loading: facilitiesLoading, refetch } = useFacilities();
  const [step, setStep] = useState(0);
  const [formLoading, setFormLoading] = useState(false);
  const [facilityData, setFacilityData] = useState<FacilityData>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    facility_type: "",
    has_hazardous_waste: null,
    waste_shipment_frequency: "",
    generates_used_oil: null,
    used_oil_storage_gallons: "",
    has_parts_washer: null,
    parts_washer_vendor_serviced: null,
    has_spray_painting: null,
    has_underground_tanks: null,
    stores_regulated_chemicals: null,
    sds_count_range: "",
    has_aboveground_tanks: null,
    has_floor_drains: null,
    has_air_emissions: null,
    generates_hazwaste: null,
  });

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  // If user already has facilities, redirect to dashboard
  if (!authLoading && !facilitiesLoading && facilities.length > 0) {
    return <Navigate to="/" replace />;
  }

  // Show loading while auth or facilities are loading
  if (authLoading || facilitiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  const updateField = (key: keyof FacilityData, value: string | boolean | null) => {
    setFacilityData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setFormLoading(true);

    // Map facility data to database columns
    const dbData = {
      user_id: user.id,
      name: facilityData.name,
      address: facilityData.address,
      city: facilityData.city,
      state: facilityData.state,
      zip_code: facilityData.zip_code,
      has_hazardous_waste: facilityData.has_hazardous_waste ?? false,
      has_paint_booth: facilityData.has_spray_painting ?? false,
      has_underground_tanks: facilityData.has_underground_tanks ?? false,
      onboarding_completed: true,
    };

    const { error } = await supabase.from("facilities").insert(dbData);

    setFormLoading(false);

    if (error) {
      toast.error("Failed to create facility: " + error.message);
    } else {
      toast.success("Facility created successfully!");
      await refetch();
      navigate("/");
    }
  };

  const questions = facilityData.facility_type === "automotive" 
    ? automotiveQuestions 
    : facilityData.facility_type === "chemical"
    ? chemicalQuestions
    : [];

  const renderQuestionInput = (q: typeof automotiveQuestions[0]) => {
    const value = facilityData[q.key as keyof FacilityData];
    
    if (q.type === "yesNo") {
      return (
        <RadioGroup
          value={value === true ? "yes" : value === false ? "no" : ""}
          onValueChange={(v) => updateField(q.key as keyof FacilityData, v === "yes")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`${q.key}-yes`} />
            <Label htmlFor={`${q.key}-yes`} className="cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`${q.key}-no`} />
            <Label htmlFor={`${q.key}-no`} className="cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      );
    }

    if (q.type === "yesNoNotSure") {
      return (
        <RadioGroup
          value={value === true ? "yes" : value === false ? "no" : value === null ? "" : "not_sure"}
          onValueChange={(v) => updateField(q.key as keyof FacilityData, v === "yes" ? true : v === "no" ? false : null)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`${q.key}-yes`} />
            <Label htmlFor={`${q.key}-yes`} className="cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`${q.key}-no`} />
            <Label htmlFor={`${q.key}-no`} className="cursor-pointer">No</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not_sure" id={`${q.key}-not-sure`} />
            <Label htmlFor={`${q.key}-not-sure`} className="cursor-pointer">Not sure</Label>
          </div>
        </RadioGroup>
      );
    }

    if (q.type === "select" && q.options) {
      return (
        <RadioGroup
          value={value as string}
          onValueChange={(v) => updateField(q.key as keyof FacilityData, v)}
          className="grid gap-2"
        >
          {q.options.map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`${q.key}-${opt}`} />
              <Label htmlFor={`${q.key}-${opt}`} className="cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    return null;
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
            <span className="font-semibold text-foreground">ComplianceHub</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Setting up your facility</span>
            <span className="text-sm text-muted-foreground">Step {step + 1} of {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Facility Basics */}
          {step === 0 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl text-foreground">Tell us about your facility</CardTitle>
                <CardDescription>
                  We'll use this information to set up your compliance profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="text-foreground">Facility Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Main Street Auto Repair"
                      value={facilityData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      required
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address" className="text-foreground">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      value={facilityData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={facilityData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-foreground">State</Label>
                      <Input
                        id="state"
                        placeholder="CA"
                        value={facilityData.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip" className="text-foreground">ZIP Code</Label>
                      <Input
                        id="zip"
                        placeholder="12345"
                        value={facilityData.zip_code}
                        onChange={(e) => updateField("zip_code", e.target.value)}
                        className="text-foreground"
                      />
                    </div>
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

          {/* Step 2: Facility Type */}
          {step === 1 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">What type of facility is this?</CardTitle>
                <CardDescription>
                  This helps us show you only the compliance requirements that apply to you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={facilityData.facility_type}
                  onValueChange={(v) => updateField("facility_type", v as FacilityType)}
                  className="grid gap-4"
                >
                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      facilityData.facility_type === "automotive"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => updateField("facility_type", "automotive")}
                  >
                    <RadioGroupItem value="automotive" id="automotive" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-5 w-5 text-primary" />
                        <Label htmlFor="automotive" className="text-base font-semibold cursor-pointer text-foreground">
                          Automotive Repair Shop
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Auto body shops, service centers, dealerships, quick lube, tire shops
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      facilityData.facility_type === "chemical"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => updateField("facility_type", "chemical")}
                  >
                    <RadioGroupItem value="chemical" id="chemical" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        <Label htmlFor="chemical" className="text-base font-semibold cursor-pointer text-foreground">
                          Chemical Storage/Handling
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Warehouses, distribution, manufacturing with chemical storage
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      facilityData.facility_type === "other"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => updateField("facility_type", "other")}
                  >
                    <RadioGroupItem value="other" id="other" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <Label htmlFor="other" className="text-base font-semibold cursor-pointer text-foreground">
                          Other / Not Sure
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We'll help you figure out what applies
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!facilityData.facility_type}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Type-specific questions */}
          {step === 2 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="p-3 bg-status-ok/10 rounded-xl w-fit mb-4">
                  <CheckCircle2 className="h-6 w-6 text-status-ok" />
                </div>
                <CardTitle className="text-2xl text-foreground">
                  {facilityData.facility_type === "other" 
                    ? "Almost done!" 
                    : "A few quick questions"}
                </CardTitle>
                <CardDescription>
                  {facilityData.facility_type === "other"
                    ? "You can start using ComplianceHub and customize later."
                    : "These help us identify which compliance requirements apply to you."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {facilityData.facility_type !== "other" && questions.length > 0 && (
                  <div className="space-y-6">
                    {questions.map((q, index) => (
                      <div key={q.key} className="space-y-3">
                        <p className="font-medium text-foreground">
                          {index + 1}. {q.question}
                        </p>
                        {renderQuestionInput(q)}
                      </div>
                    ))}
                  </div>
                )}

                {facilityData.facility_type === "other" && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-foreground">Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">{facilityData.name}</strong>
                      {facilityData.city && facilityData.state && ` • ${facilityData.city}, ${facilityData.state}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We'll help you identify applicable requirements as you use the system.
                    </p>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={formLoading}>
                    {formLoading ? "Creating..." : "Complete Setup"}
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
