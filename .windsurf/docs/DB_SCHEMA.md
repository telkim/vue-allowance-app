# DB_SCHEMA (데이터베이스 스키마)

## Supabase 테이블 구조

### 1. profiles (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  total_points INTEGER DEFAULT 0,
  total_cash INTEGER DEFAULT 0,
  level TEXT DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
```

### 2. missions (미션)
```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward_amount INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('cash', 'points')),
  recurrence TEXT NOT NULL CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_assigned_to ON missions(assigned_to);
CREATE INDEX idx_missions_created_by ON missions(created_by);
```

### 3. proposals (미션 제안)
```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward_amount INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('cash', 'points')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proposed_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_proposed_by ON proposals(proposed_by);
```

### 4. reading_books (독서 도서)
```sql
CREATE TABLE reading_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'reading', 'completed')),
  review TEXT,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reading_books_status ON reading_books(status);
CREATE INDEX idx_reading_books_completed_by ON reading_books(completed_by);
```

### 5. reward_items (보상 아이템)
```sql
CREATE TABLE reward_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  required_points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reward_items_is_active ON reward_items(is_active);
```

### 6. purchases (구매 내역)
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES reward_items(id),
  purchased_by UUID REFERENCES profiles(id),
  points_spent INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_purchases_purchased_by ON purchases(purchased_by);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at);
```

### 7. timeline (타임라인)
```sql
CREATE TABLE timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author UUID REFERENCES profiles(id),
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_timeline_author ON timeline(author);
CREATE INDEX idx_timeline_created_at ON timeline(created_at DESC);
```

### 8. settlement_schedule (정산 스케줄)
```sql
CREATE TABLE settlement_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0: Sunday, 6: Saturday
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  next_settlement_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## RLS (Row Level Security) 정책

### profiles
```sql
-- 모든 사용자가 자신의 프로필을 읽을 수 있음
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text);

-- 인증된 사용자만 프로필 생성 가능
CREATE POLICY "Authenticated users can create profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id::text);
```

### missions
```sql
-- 부모는 자신이 생성한 미션을 읽을 수 있음
CREATE POLICY "Parents can view own missions"
  ON missions FOR SELECT
  USING (
    auth.uid()::text = created_by::text OR
    auth.uid()::text = assigned_to::text
  );

-- 부모만 미션 생성 가능
CREATE POLICY "Parents can create missions"
  ON missions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'parent'
    )
  );

-- 부모는 자신의 미션을 수정 가능
CREATE POLICY "Parents can update own missions"
  ON missions FOR UPDATE
  USING (auth.uid()::text = created_by::text);

-- 할당된 자녀는 미션 상태를 완료로 변경 가능
CREATE POLICY "Children can complete assigned missions"
  ON missions FOR UPDATE
  USING (
    auth.uid()::text = assigned_to::text AND
    status = 'in_progress'
  )
  WITH CHECK (status = 'completed');
```

### proposals
```sql
-- 자녀는 자신의 제안을 읽을 수 있음
CREATE POLICY "Children can view own proposals"
  ON proposals FOR SELECT
  USING (auth.uid()::text = proposed_by::text);

-- 부모는 모든 제안을 읽을 수 있음
CREATE POLICY "Parents can view all proposals"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'parent'
    )
  );

-- 자녀만 제안 생성 가능
CREATE POLICY "Children can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'child'
    )
  );

-- 부모만 제안 승인/거절 가능
CREATE POLICY "Parents can review proposals"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'parent'
    )
  );
```

### reading_books
```sql
-- 모든 사용자가 독서 도서를 읽을 수 있음
CREATE POLICY "Users can view reading books"
  ON reading_books FOR SELECT
  USING (true);

-- 자녀만 독서 도서 생성 가능
CREATE POLICY "Children can create reading books"
  ON reading_books FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'child'
    )
  );

-- 자녀는 자신의 도서만 수정 가능
CREATE POLICY "Children can update own reading books"
  ON reading_books FOR UPDATE
  USING (auth.uid()::text = completed_by::text);
```

### reward_items
```sql
-- 모든 사용자가 활성화된 보상 아이템을 읽을 수 있음
CREATE POLICY "Users can view active reward items"
  ON reward_items FOR SELECT
  USING (is_active = true);

-- 부모만 보상 아이템 생성 가능
CREATE POLICY "Parents can create reward items"
  ON reward_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'parent'
    )
  );

-- 부모는 자신의 아이템만 수정 가능
CREATE POLICY "Parents can update own reward items"
  ON reward_items FOR UPDATE
  USING (auth.uid()::text = created_by::text);
```

### purchases
```sql
-- 자녀는 자신의 구매 내역을 읽을 수 있음
CREATE POLICY "Children can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid()::text = purchased_by::text);

-- 부모는 모든 구매 내역을 읽을 수 있음
CREATE POLICY "Parents can view all purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'parent'
    )
  );

-- 자녀만 구매 생성 가능
CREATE POLICY "Children can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = auth.uid()::text AND role = 'child'
    )
  );
```

### timeline
```sql
-- 모든 사용자가 타임라인을 읽을 수 있음
CREATE POLICY "Users can view timeline"
  ON timeline FOR SELECT
  USING (true);

-- 인증된 사용자만 타임라인 생성 가능
CREATE POLICY "Authenticated users can create timeline"
  ON timeline FOR INSERT
  WITH CHECK (auth.uid()::text = author::text);
```

## Realtime 구성

### Realtime 활성화 테이블
- missions
- proposals
- timeline
- purchases

### Realtime 필터
```javascript
// 미션 테이블 Realtime 필터 예시
supabase
  .channel('missions-channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'missions',
      filter: `assigned_to=eq.${userId}`
    },
    (payload) => { /* handle payload */ }
  )
  .subscribe()
```

## 초기 데이터 (Seed Data)

### 계정 프리셋
```sql
INSERT INTO profiles (email, name, role) VALUES
  ('hunam@family.com', '훈남', 'parent'),
  ('spring@family.com', '봄이', 'child'),
  ('summer@family.com', '여름이', 'child');
```

### 정산 스케줄 초기값
```sql
INSERT INTO settlement_schedule (frequency, day_of_week, next_settlement_date) VALUES
  ('weekly', 6, NEXT_DAY(CURRENT_DATE, 'Saturday')); -- 매주 토요일
```
