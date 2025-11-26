-- Fix car_brands RLS policy to allow unauthenticated users to view brands
DROP POLICY IF EXISTS "Everyone can read car brands" ON car_brands;

CREATE POLICY "Everyone can read car brands"
ON car_brands
FOR SELECT
TO public
USING (true);