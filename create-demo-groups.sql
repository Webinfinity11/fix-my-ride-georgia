
-- Script to create demo car community groups
-- Run this manually in Supabase SQL Editor if groups don't exist

INSERT INTO chat_rooms (name, type, is_public, description) 
SELECT 'Honda Fit Club', 'channel', true, 'Honda Fit მფლობელთა ჯგუფი'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Honda Fit Club');

INSERT INTO chat_rooms (name, type, is_public, description) 
SELECT 'BMW Owners Georgia', 'channel', true, 'BMW მფლობელთა საქართველოს ჯგუფი'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'BMW Owners Georgia');

INSERT INTO chat_rooms (name, type, is_public, description) 
SELECT 'Toyota Club Tbilisi', 'channel', true, 'Toyota კლუბი თბილისი'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Toyota Club Tbilisi');

INSERT INTO chat_rooms (name, type, is_public, description) 
SELECT 'Mercedes Club', 'channel', true, 'Mercedes-Benz მფლობელთა კლუბი'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Mercedes Club');

INSERT INTO chat_rooms (name, type, is_public, description) 
SELECT 'Mechanic Tips & Tricks', 'channel', true, 'ხელოსნების რჩევები და ხრიკები'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Mechanic Tips & Tricks');

INSERT INTO chat_rooms (name, type, is_public, description) 
SELECT 'Car Modification Georgia', 'channel', true, 'ავტომობილის მოდიფიკაცია საქართველოში'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Car Modification Georgia');

INSERT INTO chat_rooms (name, type, is_public, description) 
SELECT 'Used Car Market Tbilisi', 'channel', true, 'გამოყენებული ავტომობილების ბაზარი თბილისი'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'Used Car Market Tbilisi');
