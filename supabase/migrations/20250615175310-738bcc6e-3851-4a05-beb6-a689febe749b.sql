
-- ჩართე RLS chat_rooms-ზე
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- ადმინისტრატორებმა დაინახონ ყველა chat_rooms
CREATE POLICY "Admins can view all chat_rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- როგორც საჭირო სარგებლებისთვის (დამატებით): საშუალო სტატუსისათვის შეგიძლია დაამატო პოლიტიკა, რომ მომხმარებლებმაც ნახონ მხოლოდ საკუთარი chat_rooms, მაგრამ ამ ეტაპზე შენს მთავარ მოთხოვნას ფარავს მაღლა მოცემული.

