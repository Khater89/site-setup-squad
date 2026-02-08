
-- Add category, description, duration_minutes columns to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'nursing';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- Seed initial services data
INSERT INTO public.services (name, category, base_price, description, active) VALUES
  ('طب عام وتشخيص', 'medical', 50, 'كشف طبي عام وتشخيص في المنزل', true),
  ('خدمات الطوارئ', 'medical', 70, 'خدمات طبية طارئة في المنزل', true),
  ('علاج الكسور', 'medical', 60, 'تشخيص وعلاج الكسور منزلياً', true),
  ('تخييط الجروح', 'medical', 50, 'خياطة وإغلاق الجروح منزلياً', true),
  ('تمريض منزلي', 'nursing', 50, 'خدمات تمريضية شاملة في المنزل', true),
  ('رعاية كبار السن', 'nursing', 50, 'رعاية متخصصة لكبار السن في المنزل', true),
  ('مرافق/ة مريض (24 ساعة)', 'nursing', 50, 'مرافقة المريض على مدار الساعة', true),
  ('علاج طبيعي منزلي', 'nursing', 50, 'جلسات علاج طبيعي متكاملة في المنزل', true),
  ('تصوير أشعة منزلي', 'nursing', 60, 'تصوير أشعة في المنزل بأجهزة محمولة', true),
  ('نقل مرضى', 'nursing', 50, 'خدمة نقل المرضى بأمان وراحة', true),
  ('توفير أجهزة ومستلزمات طبية', 'nursing', 50, 'توفير وتأجير الأجهزة والمستلزمات الطبية', true),
  ('محاليل وريدية (IV Fluids)', 'nursing', 50, 'إعطاء محاليل وريدية في المنزل', true),
  ('حقن وإبر (عضلي/وريدي/فيتامينات)', 'nursing', 50, 'إعطاء حقن عضلية ووريدية وفيتامينات', true),
  ('قياس العلامات الحيوية', 'nursing', 50, 'قياس ضغط الدم والنبض والحرارة والأكسجين', true),
  ('قياس سكر الدم + متابعة سكري', 'nursing', 50, 'فحص سكر الدم ومتابعة مرضى السكري', true),
  ('عناية قدم سكري + عناية جلد', 'nursing', 50, 'عناية متخصصة بقدم السكري والجلد', true),
  ('غيارات جروح / تضميد', 'nursing', 50, 'تغيير ضمادات الجروح والعناية بها', true),
  ('رعاية ما بعد العمليات الجراحية', 'nursing', 50, 'رعاية تمريضية بعد العمليات الجراحية', true),
  ('قسطرة بولية (تركيب/تغيير/عناية)', 'nursing', 50, 'تركيب أو تغيير أو عناية بالقسطرة البولية', true),
  ('أنبوب أنفي معدي NG (تركيب/تغيير/عناية)', 'nursing', 50, 'تركيب أو تغيير أو عناية بالأنبوب الأنفي المعدي', true),
  ('سحب عينات منزلية (دم/جروح/زراعة)', 'nursing', 50, 'سحب عينات دم وجروح وزراعة في المنزل', true),
  ('حقنة شرجية منزلية', 'nursing', 50, 'إعطاء حقنة شرجية في المنزل', true);
