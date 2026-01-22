-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Facilities table (per-facility compliance management)
CREATE TABLE public.facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  
  -- Onboarding gating questions
  has_hazardous_waste BOOLEAN DEFAULT false,
  has_paint_booth BOOLEAN DEFAULT false,
  has_underground_tanks BOOLEAN DEFAULT false,
  has_air_compressor BOOLEAN DEFAULT false,
  has_lift_equipment BOOLEAN DEFAULT false,
  has_fire_suppression BOOLEAN DEFAULT false,
  has_stormwater_discharge BOOLEAN DEFAULT false,
  has_refrigerant_handling BOOLEAN DEFAULT false,
  has_osha_safety_program BOOLEAN DEFAULT false,
  employee_count INTEGER DEFAULT 1,
  
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Evidence types catalog
CREATE TABLE public.evidence_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  retention_days INTEGER DEFAULT 365,
  recurrence_days INTEGER,
  is_required BOOLEAN DEFAULT true,
  applicable_conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Evidence items (per-facility tracking)
CREATE TABLE public.evidence_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  evidence_type_id UUID NOT NULL REFERENCES public.evidence_types(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('ok', 'due_soon', 'overdue', 'needs_review', 'missing')),
  last_received_at TIMESTAMP WITH TIME ZONE,
  next_due_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Uploaded documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  evidence_item_id UUID REFERENCES public.evidence_items(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  classification TEXT,
  classification_confidence REAL,
  extracted_fields JSONB DEFAULT '{}',
  needs_review BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tasks (recurring and one-time)
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  evidence_item_id UUID REFERENCES public.evidence_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_days INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task attachments (photos/notes)
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Export packets
CREATE TABLE public.export_packets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'downloaded')),
  included_evidence_ids UUID[] DEFAULT '{}',
  missing_evidence_ids UUID[] DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_packets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for facilities
CREATE POLICY "Users can view their own facilities" 
ON public.facilities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own facilities" 
ON public.facilities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facilities" 
ON public.facilities FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facilities" 
ON public.facilities FOR DELETE 
USING (auth.uid() = user_id);

-- Evidence types are public read
CREATE POLICY "Evidence types are viewable by authenticated users" 
ON public.evidence_types FOR SELECT 
TO authenticated
USING (true);

-- RLS Policies for evidence_items (through facility ownership)
CREATE POLICY "Users can view evidence items for their facilities" 
ON public.evidence_items FOR SELECT 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can create evidence items for their facilities" 
ON public.evidence_items FOR INSERT 
WITH CHECK (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can update evidence items for their facilities" 
ON public.evidence_items FOR UPDATE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete evidence items for their facilities" 
ON public.evidence_items FOR DELETE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their facilities" 
ON public.documents FOR SELECT 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can create documents for their facilities" 
ON public.documents FOR INSERT 
WITH CHECK (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can update documents for their facilities" 
ON public.documents FOR UPDATE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete documents for their facilities" 
ON public.documents FOR DELETE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks for their facilities" 
ON public.tasks FOR SELECT 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can create tasks for their facilities" 
ON public.tasks FOR INSERT 
WITH CHECK (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can update tasks for their facilities" 
ON public.tasks FOR UPDATE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete tasks for their facilities" 
ON public.tasks FOR DELETE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

-- RLS Policies for task_attachments
CREATE POLICY "Users can view task attachments for their facilities" 
ON public.task_attachments FOR SELECT 
USING (task_id IN (SELECT id FROM public.tasks WHERE facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid())));

CREATE POLICY "Users can create task attachments for their facilities" 
ON public.task_attachments FOR INSERT 
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid())));

CREATE POLICY "Users can delete task attachments for their facilities" 
ON public.task_attachments FOR DELETE 
USING (task_id IN (SELECT id FROM public.tasks WHERE facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid())));

-- RLS Policies for export_packets
CREATE POLICY "Users can view export packets for their facilities" 
ON public.export_packets FOR SELECT 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can create export packets for their facilities" 
ON public.export_packets FOR INSERT 
WITH CHECK (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can update export packets for their facilities" 
ON public.export_packets FOR UPDATE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete export packets for their facilities" 
ON public.export_packets FOR DELETE 
USING (facility_id IN (SELECT id FROM public.facilities WHERE user_id = auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidence_items_updated_at
  BEFORE UPDATE ON public.evidence_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default evidence types for automotive repair compliance
INSERT INTO public.evidence_types (name, category, description, retention_days, recurrence_days, is_required, applicable_conditions) VALUES
('Hazardous Waste Manifest', 'Environmental', 'Documentation of hazardous waste disposal', 1095, 90, true, '{"has_hazardous_waste": true}'),
('Paint Booth Inspection', 'Environmental', 'Air quality permit and inspection records', 365, 365, true, '{"has_paint_booth": true}'),
('UST Compliance Certificate', 'Environmental', 'Underground storage tank compliance', 365, 365, true, '{"has_underground_tanks": true}'),
('Air Compressor Inspection', 'Safety', 'Pressure vessel inspection certificate', 365, 365, true, '{"has_air_compressor": true}'),
('Lift Equipment Certification', 'Safety', 'Automotive lift inspection and certification', 365, 365, true, '{"has_lift_equipment": true}'),
('Fire Suppression Inspection', 'Safety', 'Fire suppression system inspection', 365, 365, true, '{"has_fire_suppression": true}'),
('Stormwater Permit', 'Environmental', 'Stormwater discharge permit documentation', 365, 365, true, '{"has_stormwater_discharge": true}'),
('EPA 608 Certification', 'Environmental', 'Refrigerant handling certification', 1095, null, true, '{"has_refrigerant_handling": true}'),
('OSHA Safety Program', 'Safety', 'Written safety and health program', 365, 365, true, '{"has_osha_safety_program": true}'),
('Business License', 'Administrative', 'Current business operating license', 365, 365, true, '{}'),
('Workers Comp Insurance', 'Administrative', 'Workers compensation insurance certificate', 365, 365, true, '{}'),
('General Liability Insurance', 'Administrative', 'General liability insurance certificate', 365, 365, true, '{}'),
('SDS Binder', 'Safety', 'Safety Data Sheets for chemicals on site', 365, null, true, '{}'),
('Employee Training Records', 'Safety', 'Documentation of employee safety training', 1095, 365, true, '{}'),
('First Aid Kit Inspection', 'Safety', 'Monthly first aid kit inspection log', 365, 30, true, '{}'),
('Eye Wash Station Test', 'Safety', 'Weekly eye wash station flush test log', 365, 7, true, '{}'),
('Fire Extinguisher Inspection', 'Safety', 'Monthly fire extinguisher inspection tag', 365, 30, true, '{}'),
('Emergency Exit Inspection', 'Safety', 'Monthly emergency exit and lighting check', 365, 30, true, '{}');

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-documents', 'compliance-documents', false);

-- Storage policies
CREATE POLICY "Users can upload documents to their facilities"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'compliance-documents' AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their facility documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'compliance-documents' AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.facilities WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their facility documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'compliance-documents' AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.facilities WHERE user_id = auth.uid()));