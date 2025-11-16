# 🚀 Migration Deployment Guide - Fix Pin Functionality

## პრობლემის აღწერა

Community პოსტების pin ფუნქცია არ მუშაობდა **3 კრიტიკული შეცდომის** გამო:

1. ❌ **`is_admin(uuid)` ფუნქცია არ არსებობს** - ბევრი RLS policy იყენებს `is_admin(auth.uid())` მაგრამ ეს ფუნქცია არასოდეს ყოფილა შექმნილი database-ში
2. ❌ **`get_community_feed()` არ აბრუნებს pin ველებს** - Frontend ვერ იღებს `is_pinned`, `pinned_at`, `pinned_by` ინფორმაციას
3. ❌ **Edge function არ ამოწმებს admin უფლებებს** - უსაფრთხოების რისკი

## ✅ რა გასწორდა

### 1. შეიქმნა `is_admin(user_id UUID)` ფუნქცია
```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
```
- **Impact:** აფიქსებს არა მხოლოდ pin ფუნქციას, არამედ **ყველა სხვა ფუნქციას** რომელიც იყენებს `is_admin()` RLS policies-ში
- **Breaking Changes:** არ არის - ეს ახალი ფუნქციაა

### 2. განახლდა `get_community_feed()` ფუნქცია
```sql
RETURNS TABLE (
  ...
  is_pinned BOOLEAN,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID
)
```
- **Impact:** აბრუნებს pin ველებს frontend-ისთვის
- **Breaking Changes:** არ არის - TypeScript ტიპები უკვე აქვთ ეს ველები როგორც optional
- **Sorting:** დაპინული პოსტები **ყოველთვის პირველები** არიან sort order-დან დამოუკიდებლად

### 3. Edge Function განახლება
```typescript
async function pinPost(supabaseClient: any, userId: string, data: any) {
  // Check if user is admin
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can pin/unpin posts');
  }
  ...
}
```
- **Impact:** მხოლოდ admin-ებს შეუძლიათ პოსტების pin/unpin
- **Breaking Changes:** არ არის - ფუნქცია უკვე არსებობდა, მხოლოდ უსაფრთხოება გაუმჯობესდა

## 📋 Migration Deployment Steps

### Option 1: Supabase Dashboard (რეკომენდირებული)

1. **გადადით Supabase Dashboard-ზე:**
   - Project: `kwozniwtygkdoagjegom`
   - URL: https://supabase.com/dashboard/project/kwozniwtygkdoagjegom

2. **გახსენით SQL Editor:**
   - Left sidebar → SQL Editor
   - ან: https://supabase.com/dashboard/project/kwozniwtygkdoagjegom/sql/new

3. **დააკოპირეთ და გაუშვით migration:**
   - გახსენით ფაილი: `supabase/migrations/20251116080000_fix_pin_functionality.sql`
   - დააკოპირეთ მთელი შინაარსი
   - ჩასვით SQL Editor-ში
   - დააჭირეთ **Run** (Ctrl/Cmd + Enter)

4. **გადაამოწმეთ წარმატებული შესრულება:**
   ```sql
   -- შეამოწმეთ რომ ფუნქცია შექმნილია
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('is_admin', 'get_community_feed');
   ```
   უნდა დაბრუნდეს 2 ჩანაწერი.

### Option 2: Supabase CLI (Advanced)

თუ გაქვთ Supabase CLI დაყენებული:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kwozniwtygkdoagjegom

# Push migration
supabase db push

# Or apply specific migration
supabase migration up
```

## 🧪 Testing Checklist

Migration-ის შემდეგ გადაამოწმეთ:

### 1. ✅ Admin Pin Functionality
- [ ] Admin-ით შესვლა
- [ ] Community გვერდზე გადასვლა (`/community`)
- [ ] პოსტზე three-dots menu → "აპინვა"
- [ ] პოსტი უნდა გადავიდეს სიის თავში "📌 აპინული" Badge-ით

### 2. ✅ Pin Persistence
- [ ] გვერდის refresh
- [ ] დაპინული პოსტი კვლავ პირველია
- [ ] დაპინული პოსტზე Badge ჩანს

### 3. ✅ Unpin Functionality
- [ ] დაპინულ პოსტზე three-dots → "გაუქმება"
- [ ] პოსტი უბრუნდება თავის ადგილს chronological order-ში
- [ ] Badge აღარ ჩანს

### 4. ✅ Non-Admin Protection
- [ ] არა-admin მომხმარებლით შესვლა
- [ ] პოსტზე three-dots menu-ში "აპინვა" არ უნდა ჩანდეს
- [ ] თუ manually გაეშვა API call → უნდა დაბრუნდეს "Unauthorized" error

### 5. ✅ Existing Functionality Preserved
- [ ] პოსტების შექმნა მუშაობს
- [ ] Like/Comment/Save მუშაობს
- [ ] Sorting by Latest/Top მუშაობს
- [ ] Tag filtering მუშაობს
- [ ] Search მუშაობს

## 📊 Impact Analysis

### 🟢 Positive Impact (რას აფიქსებს)
- ✅ Pin ფუნქცია დაიწყებს მუშაობას
- ✅ **სხვა admin ფუნქციებიც დაიწყებენ მუშაობას** (service categories, cities, districts, fuel importers და სხვა)
- ✅ უსაფრთხოება გაუმჯობესდება (admin-only actions დაცული)

### 🟡 Potential Issues (რისი მონიტორინგია საჭირო)

1. **Performance:**
   - `get_community_feed()` ახლა აბრუნებს 3 დამატებით ველს
   - **Risk Level:** დაბალი - minimal overhead
   - **Solution:** მონიტორინგი query performance-ზე

2. **Caching:**
   - თუ გამოიყენება frontend caching, შეიძლება დროებით ძველი data ჩანდეს
   - **Solution:** `queryClient.invalidateQueries` უკვე გვაქვს hook-ში

## 🔄 Rollback Plan

თუ რაიმე პრობლემა წარმოიქმნება:

```sql
-- 1. Rollback get_community_feed to old version
DROP FUNCTION IF EXISTS get_community_feed(TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_community_feed(
    sort_by TEXT DEFAULT 'latest',
    filter_tag TEXT DEFAULT NULL,
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    post_id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar TEXT,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    thumbnail_url TEXT,
    tags JSONB,
    like_count BIGINT,
    comment_count BIGINT,
    is_liked BOOLEAN,
    is_saved BOOLEAN,
    created_at TIMESTAMPTZ,
    score INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS post_id,
        p.author_id,
        CONCAT(prof.first_name, ' ', prof.last_name) AS author_name,
        prof.avatar_url AS author_avatar,
        p.content,
        pm.media_url,
        pm.media_type,
        pm.thumbnail_url,
        COALESCE(
            json_agg(
                json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
        )::jsonb AS tags,
        COUNT(DISTINCT pl.id) AS like_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.is_deleted = FALSE) AS comment_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_likes.post_id = p.id AND post_likes.user_id = auth.uid()) AS is_liked,
        EXISTS(SELECT 1 FROM post_saves WHERE post_saves.post_id = p.id AND post_saves.user_id = auth.uid()) AS is_saved,
        p.created_at,
        p.score
    FROM posts p
    INNER JOIN profiles prof ON p.author_id = prof.id
    LEFT JOIN post_media pm ON p.id = pm.post_id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE
        p.is_deleted = FALSE
        AND (filter_tag IS NULL OR t.slug = filter_tag)
    GROUP BY
        p.id, p.author_id, prof.first_name, prof.last_name,
        prof.avatar_url, p.content, pm.media_url, pm.media_type,
        pm.thumbnail_url, p.created_at, p.score
    ORDER BY
        CASE
            WHEN sort_by = 'latest' THEN p.created_at
            ELSE NULL
        END DESC,
        CASE
            WHEN sort_by = 'top' THEN p.score
            ELSE NULL
        END DESC,
        CASE
            WHEN sort_by = 'top' THEN p.last_interacted_at
            ELSE NULL
        END DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$;

-- 2. ⚠️ არ წაშალოთ is_admin ფუნქცია - სხვა ფუნქციებმაც შეიძლება გამოიყენონ!
```

## 📝 Notes

- **Migration ფაილი:** `supabase/migrations/20251116080000_fix_pin_functionality.sql`
- **Edge Function:** `supabase/functions/community-action/index.ts`
- **Frontend Hook:** `src/hooks/useCommunityPosts.ts` (არ საჭიროებს ცვლილებას)
- **UI Component:** `src/components/community/PostCard.tsx` (უკვე მზადაა)

## ✨ Additional Benefits

Migration-ის გაშვების შემდეგ **დაიწყებს მუშაობას ეს ფუნქციებიც:**

1. ✅ Admin service categories management
2. ✅ Admin cities management
3. ✅ Admin districts management
4. ✅ Admin fuel importers management
5. ✅ Admin posts soft delete/undelete

ყველა ეს ფუნქცია იყენებს `is_admin(auth.uid())` RLS policies-ში და ახლა პირველად იმუშავებს!

---

**მზადაა deployment-ისთვის! 🚀**
