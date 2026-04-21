INSERT INTO compliance_categories (id, name, icon, sort_order) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Perizinan', 'shield', 1) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO compliance_rules (id, title, description, category_id, priority, conditions, legal_references, is_published) 
VALUES 
('30000000-0000-0000-0000-000000000001', 'NIB (Nomor Induk Berusaha)', 'Wajib memiliki NIB.', '00000000-0000-0000-0000-000000000001', 'HIGH', '{}'::json, '["PP No. 5 Tahun 2021"]'::json, true),
('30000000-0000-0000-0000-000000000002', 'NPWP Perusahaan', 'Wajib NPWP.', '00000000-0000-0000-0000-000000000001', 'HIGH', '{}'::json, '["UU KUP"]'::json, true),
('30000000-0000-0000-0000-000000000003', 'Sertifikat Standar / Izin Operasional', 'Sertifikat standar untuk resiko menengah.', '00000000-0000-0000-0000-000000000001', 'MEDIUM', '{}'::json, '["Peraturan BKPM"]'::json, true)
ON CONFLICT (id) DO NOTHING;
