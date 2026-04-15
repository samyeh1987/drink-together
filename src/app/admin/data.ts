// Demo data for admin pages

// ─── Users ───────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  age_range: string | null;
  occupation: string | null;
  bio: string | null;
  languages_spoken: string[];
  credit_score: number;
  email_verified: boolean;
  created_at: string;
  status: 'active' | 'banned' | 'suspended';
  total_meals_hosted: number;
  total_meals_joined: number;
  no_show_count: number;
  last_active: string;
}

export const DEMO_USERS: AdminUser[] = [
  {
    id: 'u001', email: 'sarah.k@gmail.com', nickname: 'Sarah K.', avatar_url: null,
    age_range: '25-30', occupation: 'Digital Marketing', bio: 'Love trying new restaurants!', languages_spoken: ['en', 'th'],
    credit_score: 156, email_verified: true, created_at: '2026-01-15T10:00:00Z', status: 'active',
    total_meals_hosted: 12, total_meals_joined: 23, no_show_count: 0, last_active: '2026-04-15T20:30:00Z',
  },
  {
    id: 'u002', email: 'alex.wei@outlook.com', nickname: 'Alex W.', avatar_url: null,
    age_range: '30-35', occupation: 'Software Engineer', bio: 'Foodie from Taiwan', languages_spoken: ['zh', 'en', 'ja'],
    credit_score: 132, email_verified: true, created_at: '2026-01-20T08:00:00Z', status: 'active',
    total_meals_hosted: 8, total_meals_joined: 15, no_show_count: 1, last_active: '2026-04-15T18:00:00Z',
  },
  {
    id: 'u003', email: 'mike.low@gmail.com', nickname: 'Mike L.', avatar_url: null,
    age_range: '25-30', occupation: 'Startup Founder', bio: null, languages_spoken: ['en'],
    credit_score: 95, email_verified: true, created_at: '2026-02-01T12:00:00Z', status: 'active',
    total_meals_hosted: 5, total_meals_joined: 10, no_show_count: 2, last_active: '2026-04-14T22:00:00Z',
  },
  {
    id: 'u004', email: 'yuki.tanaka@yahoo.co.jp', nickname: 'Yuki T.', avatar_url: null,
    age_range: '20-25', occupation: 'Student', bio: 'Exchange student in BKK', languages_spoken: ['ja', 'en', 'th'],
    credit_score: 168, email_verified: true, created_at: '2026-02-10T09:00:00Z', status: 'active',
    total_meals_hosted: 15, total_meals_joined: 20, no_show_count: 0, last_active: '2026-04-15T21:00:00Z',
  },
  {
    id: 'u005', email: 'carlos.r@gmail.com', nickname: 'Carlos R.', avatar_url: null,
    age_range: '30-35', occupation: 'Chef', bio: null, languages_spoken: ['en', 'th'],
    credit_score: 42, email_verified: false, created_at: '2026-03-01T14:00:00Z', status: 'suspended',
    total_meals_hosted: 2, total_meals_joined: 4, no_show_count: 3, last_active: '2026-04-10T16:00:00Z',
  },
  {
    id: 'u006', email: 'emma.thompson@gmail.com', nickname: 'Emma T.', avatar_url: null,
    age_range: '25-30', occupation: 'UX Designer', bio: 'Design & Food lover', languages_spoken: ['en', 'zh'],
    credit_score: 128, email_verified: true, created_at: '2026-03-05T11:00:00Z', status: 'active',
    total_meals_hosted: 7, total_meals_joined: 18, no_show_count: 0, last_active: '2026-04-15T19:00:00Z',
  },
  {
    id: 'u007', email: 'lisa.m@gmail.com', nickname: 'Lisa M.', avatar_url: null,
    age_range: '20-25', occupation: 'Freelancer', bio: null, languages_spoken: ['en', 'th'],
    credit_score: 100, email_verified: true, created_at: '2026-03-12T08:00:00Z', status: 'active',
    total_meals_hosted: 3, total_meals_joined: 8, no_show_count: 1, last_active: '2026-04-13T15:00:00Z',
  },
  {
    id: 'u008', email: 'david.chen@hotmail.com', nickname: 'David C.', avatar_url: null,
    age_range: '30-35', occupation: 'Product Manager', bio: 'From Shanghai, living in BKK', languages_spoken: ['zh', 'en'],
    credit_score: 115, email_verified: true, created_at: '2026-03-15T10:00:00Z', status: 'active',
    total_meals_hosted: 6, total_meals_joined: 12, no_show_count: 0, last_active: '2026-04-15T17:30:00Z',
  },
  {
    id: 'u009', email: 'noy.s@gmail.com', nickname: 'Noy S.', avatar_url: null,
    age_range: '25-30', occupation: 'Tour Guide', bio: 'Local food expert!', languages_spoken: ['th', 'en'],
    credit_score: 145, email_verified: true, created_at: '2026-01-25T07:00:00Z', status: 'active',
    total_meals_hosted: 18, total_meals_joined: 25, no_show_count: 0, last_active: '2026-04-15T21:30:00Z',
  },
  {
    id: 'u010', email: 'marco.b@gmail.com', nickname: 'Marco B.', avatar_url: null,
    age_range: '25-30', occupation: 'Translator', bio: null, languages_spoken: ['en', 'th', 'ja'],
    credit_score: 88, email_verified: false, created_at: '2026-04-01T13:00:00Z', status: 'banned',
    total_meals_hosted: 1, total_meals_joined: 3, no_show_count: 2, last_active: '2026-04-08T11:00:00Z',
  },
  {
    id: 'u011', email: 'priya.s@gmail.com', nickname: 'Priya S.', avatar_url: null,
    age_range: '25-30', occupation: 'Content Creator', bio: 'Food blogger & vlogger', languages_spoken: ['en', 'th'],
    credit_score: 110, email_verified: true, created_at: '2026-02-20T10:00:00Z', status: 'active',
    total_meals_hosted: 9, total_meals_joined: 14, no_show_count: 0, last_active: '2026-04-15T20:00:00Z',
  },
  {
    id: 'u012', email: 'tom.h@gmail.com', nickname: 'Tom H.', avatar_url: null,
    age_range: '35-40', occupation: 'Retired Teacher', bio: 'Love meeting young people', languages_spoken: ['en'],
    credit_score: 175, email_verified: true, created_at: '2026-01-10T08:00:00Z', status: 'active',
    total_meals_hosted: 22, total_meals_joined: 30, no_show_count: 0, last_active: '2026-04-15T18:30:00Z',
  },
];

// ─── Meals ───────────────────────────────────────────
export interface AdminMeal {
  id: string;
  title: string;
  restaurant_name: string;
  restaurant_address: string;
  cuisine_type: string;
  meal_languages: string[];
  datetime: string;
  deadline: string;
  min_participants: number;
  max_participants: number;
  payment_method: string;
  budget_min: number | null;
  budget_max: number | null;
  description: string;
  status: string;
  created_at: string;
  creator_name: string;
  current_participants: number;
  reports_count: number;
  is_restaurant_hosted: boolean;
}

export const DEMO_MEALS: AdminMeal[] = [
  {
    id: 'm001', title: 'Friday Night Izakaya 🍶', restaurant_name: 'Ninja Izakaya', restaurant_address: 'Thonglor Soi 13',
    cuisine_type: 'japanese', meal_languages: ['en', 'ja'], datetime: '2026-04-18T19:00:00Z', deadline: '2026-04-18T13:00:00Z',
    min_participants: 4, max_participants: 8, payment_method: 'splitBill', budget_min: 500, budget_max: 800,
    description: 'Casual Japanese izakaya vibes with sake!', status: 'open', created_at: '2026-04-14T10:00:00Z',
    creator_name: 'Sarah K.', current_participants: 4, reports_count: 0, is_restaurant_hosted: false,
  },
  {
    id: 'm002', title: 'Weekend Hotpot Feast 🫕', restaurant_name: 'Haidilao', restaurant_address: 'Siam Paragon 5F',
    cuisine_type: 'hotpot', meal_languages: ['zh', 'en'], datetime: '2026-04-19T18:30:00Z', deadline: '2026-04-19T12:00:00Z',
    min_participants: 4, max_participants: 10, payment_method: 'splitBill', budget_min: 400, budget_max: 600,
    description: 'Haidilao is always better with friends!', status: 'confirmed', created_at: '2026-04-13T15:00:00Z',
    creator_name: 'Alex W.', current_participants: 7, reports_count: 0, is_restaurant_hosted: false,
  },
  {
    id: 'm003', title: 'Korean BBQ Night 🔥', restaurant_name: 'Maple House', restaurant_address: 'Ari Soi 3',
    cuisine_type: 'korean', meal_languages: ['en', 'ko'], datetime: '2026-04-20T19:30:00Z', deadline: '2026-04-20T13:00:00Z',
    min_participants: 3, max_participants: 8, payment_method: 'hostTreats', budget_min: null, budget_max: null,
    description: 'My treat! Let\'s enjoy Korean BBQ together.', status: 'open', created_at: '2026-04-15T09:00:00Z',
    creator_name: 'Mike L.', current_participants: 3, reports_count: 1, is_restaurant_hosted: false,
  },
  {
    id: 'm004', title: 'Dim Sum Brunch 🥟', restaurant_name: 'Tim Ho Wan', restaurant_address: 'Central Embassy 6F',
    cuisine_type: 'dimsum', meal_languages: ['en', 'zh'], datetime: '2026-04-21T09:00:00Z', deadline: '2026-04-21T07:00:00Z',
    min_participants: 2, max_participants: 6, payment_method: 'splitBill', budget_min: 200, budget_max: 350,
    description: 'Weekend dim sum brunch!', status: 'pending', created_at: '2026-04-15T16:00:00Z',
    creator_name: 'David C.', current_participants: 2, reports_count: 0, is_restaurant_hosted: false,
  },
  {
    id: 'm005', title: 'Thai Cooking Class 🍛', restaurant_name: 'Silom Thai Cooking Studio', restaurant_address: 'Silom Soi 11',
    cuisine_type: 'thai', meal_languages: ['en', 'th'], datetime: '2026-04-17T11:00:00Z', deadline: '2026-04-16T18:00:00Z',
    min_participants: 6, max_participants: 8, payment_method: 'payOwn', budget_min: 1200, budget_max: 1500,
    description: 'Learn to cook authentic Thai dishes!', status: 'completed', created_at: '2026-04-10T08:00:00Z',
    creator_name: 'Noy S.', current_participants: 8, reports_count: 0, is_restaurant_hosted: true,
  },
  {
    id: 'm006', title: 'Italian Wine Dinner 🍷', restaurant_name: 'Appia', restaurant_address: 'Ekkamai Soi 12',
    cuisine_type: 'italian', meal_languages: ['en'], datetime: '2026-04-16T19:00:00Z', deadline: '2026-04-16T12:00:00Z',
    min_participants: 4, max_participants: 8, payment_method: 'hostTreats', budget_min: null, budget_max: null,
    description: 'Wine pairing dinner with homemade pasta.', status: 'completed', created_at: '2026-04-09T14:00:00Z',
    creator_name: 'Emma T.', current_participants: 6, reports_count: 0, is_restaurant_hosted: false,
  },
  {
    id: 'm007', title: 'Seafood BBQ Party 🦐', restaurant_name: 'Somboon Seafood', restaurant_address: 'Samsen Rd',
    cuisine_type: 'seafood', meal_languages: ['en', 'th', 'zh'], datetime: '2026-04-22T18:00:00Z', deadline: '2026-04-22T12:00:00Z',
    min_participants: 4, max_participants: 12, payment_method: 'splitBill', budget_min: 600, budget_max: 1000,
    description: 'Famous curry crab & grilled seafood!', status: 'open', created_at: '2026-04-15T12:00:00Z',
    creator_name: 'Noy S.', current_participants: 5, reports_count: 0, is_restaurant_hosted: true,
  },
  {
    id: 'm008', title: 'Tacos Night 🌮', restaurant_name: 'La Monita', restaurant_address: 'Sukhumvit Soi 39',
    cuisine_type: 'other', meal_languages: ['en'], datetime: '2026-04-15T20:00:00Z', deadline: '2026-04-15T16:00:00Z',
    min_participants: 3, max_participants: 6, payment_method: 'splitBill', budget_min: 300, budget_max: 500,
    description: 'Tuesday tacos! Great vibes.', status: 'cancelled', created_at: '2026-04-12T11:00:00Z',
    creator_name: 'Carlos R.', current_participants: 2, reports_count: 2, is_restaurant_hosted: false,
  },
  {
    id: 'm009', title: 'Buffet Breakfast 🥐', restaurant_name: 'Grand Hyatt Erawan', restaurant_address: 'Ratchadamri Rd',
    cuisine_type: 'buffet', meal_languages: ['en', 'th'], datetime: '2026-04-23T08:00:00Z', deadline: '2026-04-22T20:00:00Z',
    min_participants: 2, max_participants: 8, payment_method: 'payOwn', budget_min: 1500, budget_max: 2000,
    description: 'Luxury breakfast buffet experience.', status: 'open', created_at: '2026-04-15T14:00:00Z',
    creator_name: 'Tom H.', current_participants: 3, reports_count: 0, is_restaurant_hosted: true,
  },
  {
    id: 'm010', title: 'Vegetarian Feast 🥗', restaurant_name: 'Broccoli Revolution', restaurant_address: 'Sukhumvit Soi 49',
    cuisine_type: 'vegetarian', meal_languages: ['en'], datetime: '2026-04-24T12:00:00Z', deadline: '2026-04-24T08:00:00Z',
    min_participants: 2, max_participants: 6, payment_method: 'splitBill', budget_min: 250, budget_max: 400,
    description: 'Plant-based dining for health lovers!', status: 'pending', created_at: '2026-04-15T18:00:00Z',
    creator_name: 'Lisa M.', current_participants: 1, reports_count: 0, is_restaurant_hosted: false,
  },
];

// ─── Restaurants ─────────────────────────────────────
export interface AdminRestaurant {
  id: string;
  name: string;
  name_local: string;
  address: string;
  cuisine_type: string;
  phone: string;
  email: string;
  contact_person: string;
  latitude: number;
  longitude: number;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
  total_meals_hosted: number;
  total_deals: number;
  description: string;
  avatar_url: string | null;
  deals: RestaurantDeal[];
}

export interface RestaurantDeal {
  id: string;
  title: string;
  description: string;
  original_price: number;
  deal_price: number;
  min_pax: number;
  max_pax: number;
  valid_until: string;
  status: 'active' | 'expired' | 'draft';
}

export const DEMO_RESTAURANTS: AdminRestaurant[] = [
  {
    id: 'r001', name: 'Ninja Izakaya', name_local: 'นินจา อิซากายะ', address: 'Thonglor Soi 13, Bangkok',
    cuisine_type: 'japanese', phone: '+66-2-111-1111', email: 'info@ninja-bkk.com',
    contact_person: 'Tanaka-san', latitude: 13.7314, longitude: 100.5714, rating: 4.5,
    status: 'active', joined_at: '2026-02-01', total_meals_hosted: 8, total_deals: 2,
    description: 'Authentic Japanese izakaya with premium sake selection.',
    avatar_url: null,
    deals: [
      { id: 'd001', title: 'Sake Set Dinner', description: '5 kinds of sake + 8 dishes sharing platter', original_price: 1200, deal_price: 899, min_pax: 4, max_pax: 8, valid_until: '2026-06-30', status: 'active' },
      { id: 'd002', title: 'Weekday Lunch Set', description: '2 dishes + rice + miso soup + drink', original_price: 450, deal_price: 299, min_pax: 2, max_pax: 6, valid_until: '2026-05-31', status: 'active' },
    ],
  },
  {
    id: 'r002', name: 'Haidilao', name_local: '海底撈', address: 'Siam Paragon 5F, Bangkok',
    cuisine_type: 'hotpot', phone: '+66-2-222-2222', email: 'siam@haidilao.co.th',
    contact_person: 'Ms. Chen', latitude: 13.7465, longitude: 100.5327, rating: 4.7,
    status: 'active', joined_at: '2026-01-15', total_meals_hosted: 15, total_deals: 3,
    description: 'Premium hotpot with legendary service.',
    avatar_url: null,
    deals: [
      { id: 'd003', title: 'Group Hotpot Party', description: 'Tomato + spicy broth, 12 items platter', original_price: 800, deal_price: 599, min_pax: 6, max_pax: 10, valid_until: '2026-07-31', status: 'active' },
      { id: 'd004', title: 'Couples Set', description: '2 broths + 8 items + dessert', original_price: 1200, deal_price: 899, min_pax: 2, max_pax: 2, valid_until: '2026-05-15', status: 'expired' },
    ],
  },
  {
    id: 'r003', name: 'Silom Thai Cooking Studio', name_local: 'สีลม ครัวไทย', address: 'Silom Soi 11, Bangkok',
    cuisine_type: 'thai', phone: '+66-2-333-3333', email: 'hello@silomcooking.com',
    contact_person: 'Chef Noy', latitude: 13.7240, longitude: 100.5280, rating: 4.8,
    status: 'active', joined_at: '2026-02-10', total_meals_hosted: 12, total_deals: 1,
    description: 'Hands-on Thai cooking classes in the heart of Bangkok.',
    avatar_url: null,
    deals: [
      { id: 'd005', title: 'Group Cooking Class', description: '3 dishes + market tour + recipes', original_price: 2000, deal_price: 1500, min_pax: 6, max_pax: 8, valid_until: '2026-08-31', status: 'active' },
    ],
  },
  {
    id: 'r004', name: 'Somboon Seafood', name_local: 'สมบูรณ์ซีฟู้ด', address: 'Samsen Rd, Bangkok',
    cuisine_type: 'seafood', phone: '+66-2-444-4444', email: 'info@somboon.com',
    contact_person: 'Mr. Somboon', latitude: 13.7580, longitude: 100.4980, rating: 4.3,
    status: 'active', joined_at: '2026-03-01', total_meals_hosted: 6, total_deals: 1,
    description: 'Famous for curry crab and grilled seafood since 1969.',
    avatar_url: null,
    deals: [
      { id: 'd006', title: 'Signature Crab Set', description: 'Fried curry crab + 4 seafood dishes + rice', original_price: 1500, deal_price: 1199, min_pax: 4, max_pax: 12, valid_until: '2026-06-30', status: 'active' },
    ],
  },
  {
    id: 'r005', name: 'Grand Hyatt Erawan', name_local: 'แกรนด์ ไฮแอท เอราวัณ', address: 'Ratchadamri Rd, Bangkok',
    cuisine_type: 'buffet', phone: '+66-2-555-5555', email: 'dining@bangkok.grand.hyatt.com',
    contact_person: 'F&B Manager', latitude: 13.7470, longitude: 100.5350, rating: 4.6,
    status: 'pending', joined_at: '2026-04-10', total_meals_hosted: 2, total_deals: 0,
    description: 'Luxury 5-star hotel breakfast & dinner buffet.',
    avatar_url: null,
    deals: [
      { id: 'd007', title: 'Luxury Breakfast Buffet', description: 'Full international breakfast spread', original_price: 2000, deal_price: 1500, min_pax: 4, max_pax: 8, valid_until: '2026-07-31', status: 'draft' },
    ],
  },
];

// ─── Reports ─────────────────────────────────────────
export interface AdminReport {
  id: string;
  reporter_name: string;
  reporter_email: string;
  reported_user_name: string | null;
  reported_user_email: string | null;
  meal_title: string;
  meal_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

export const REPORT_REASONS = [
  'no_show',
  'harassment',
  'inappropriate_behavior',
  'spam',
  'fake_profile',
  'safety_concern',
  'other',
] as const;

export const DEMO_REPORTS: AdminReport[] = [
  {
    id: 'rp001', reporter_name: 'Emma T.', reporter_email: 'emma.thompson@gmail.com',
    reported_user_name: 'Carlos R.', reported_user_email: 'carlos.r@gmail.com',
    meal_title: 'Tacos Night 🌮', meal_id: 'm008',
    reason: 'no_show', description: 'Carlos confirmed he would come but never showed up. Didn\'t reply to messages either.',
    status: 'pending', created_at: '2026-04-15T22:00:00Z', resolved_at: null, resolution_note: null,
  },
  {
    id: 'rp002', reporter_name: 'Alex W.', reporter_email: 'alex.wei@outlook.com',
    reported_user_name: 'Carlos R.', reported_user_email: 'carlos.r@gmail.com',
    meal_title: 'Tacos Night 🌮', meal_id: 'm008',
    reason: 'inappropriate_behavior', description: 'Made other participants uncomfortable with aggressive behavior and inappropriate comments.',
    status: 'reviewing', created_at: '2026-04-15T22:30:00Z', resolved_at: null, resolution_note: null,
  },
  {
    id: 'rp003', reporter_name: 'Sarah K.', reporter_email: 'sarah.k@gmail.com',
    reported_user_name: null, reported_user_email: null,
    meal_title: 'Korean BBQ Night 🔥', meal_id: 'm003',
    reason: 'safety_concern', description: 'The restaurant address seems incorrect. Google Maps shows a different location.',
    status: 'pending', created_at: '2026-04-15T18:00:00Z', resolved_at: null, resolution_note: null,
  },
  {
    id: 'rp004', reporter_name: 'Priya S.', reporter_email: 'priya.s@gmail.com',
    reported_user_name: 'Marco B.', reported_user_email: 'marco.b@gmail.com',
    meal_title: 'Friday Night Izakaya 🍶', meal_id: 'm001',
    reason: 'harassment', description: 'Sent unsolicited direct messages after the meal. Multiple times despite being asked to stop.',
    status: 'resolved', created_at: '2026-04-10T20:00:00Z', resolved_at: '2026-04-11T10:00:00Z',
    resolution_note: 'User Marco B. banned. Reporter notified.',
  },
  {
    id: 'rp005', reporter_name: 'David C.', reporter_email: 'david.chen@hotmail.com',
    reported_user_name: null, reported_user_email: null,
    meal_title: 'Dim Sum Brunch 🥟', meal_id: 'm004',
    reason: 'spam', description: 'The meal description contains promotional content for a different business.',
    status: 'dismissed', created_at: '2026-04-14T09:00:00Z', resolved_at: '2026-04-14T14:00:00Z',
    resolution_note: 'Reviewed - the mention was casual, not promotional. Dismissed.',
  },
  {
    id: 'rp006', reporter_name: 'Yuki T.', reporter_email: 'yuki.tanaka@yahoo.co.jp',
    reported_user_name: 'Mike L.', reported_user_email: 'mike.low@gmail.com',
    meal_title: 'Korean BBQ Night 🔥', meal_id: 'm003',
    reason: 'fake_profile', description: 'Profile says "Chef" but conversation suggests otherwise. Photos seem stock/AI generated.',
    status: 'pending', created_at: '2026-04-15T19:00:00Z', resolved_at: null, resolution_note: null,
  },
];

// ─── Photos ──────────────────────────────────────────
export interface AdminPhoto {
  id: string;
  meal_id: string;
  meal_title: string;
  uploader_name: string;
  uploader_email: string;
  url: string;
  caption: string | null;
  likes_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const DEMO_PHOTOS: AdminPhoto[] = [
  {
    id: 'ph001', meal_id: 'm005', meal_title: 'Thai Cooking Class 🍛', uploader_name: 'Noy S.', uploader_email: 'noy.s@gmail.com',
    url: '/demo/cooking-class-1.jpg', caption: 'Our pad thai turned out amazing!', likes_count: 42, status: 'featured',
    created_at: '2026-04-17T14:00:00Z', reviewed_at: '2026-04-17T15:00:00Z', reviewed_by: 'Admin',
  },
  {
    id: 'ph002', meal_id: 'm005', meal_title: 'Thai Cooking Class 🍛', uploader_name: 'Sarah K.', uploader_email: 'sarah.k@gmail.com',
    url: '/demo/cooking-class-2.jpg', caption: null, likes_count: 28, status: 'approved',
    created_at: '2026-04-17T14:30:00Z', reviewed_at: '2026-04-17T16:00:00Z', reviewed_by: 'Admin',
  },
  {
    id: 'ph003', meal_id: 'm006', meal_title: 'Italian Wine Dinner 🍷', uploader_name: 'Emma T.', uploader_email: 'emma.thompson@gmail.com',
    url: '/demo/wine-dinner-1.jpg', caption: 'Homemade pasta night!', likes_count: 35, status: 'approved',
    created_at: '2026-04-16T21:00:00Z', reviewed_at: '2026-04-17T09:00:00Z', reviewed_by: 'Admin',
  },
  {
    id: 'ph004', meal_id: 'm006', meal_title: 'Italian Wine Dinner 🍷', uploader_name: 'Tom H.', uploader_email: 'tom.h@gmail.com',
    url: '/demo/wine-dinner-2.jpg', caption: 'Great wine selection tonight', likes_count: 19, status: 'pending',
    created_at: '2026-04-16T21:30:00Z', reviewed_at: null, reviewed_by: null,
  },
  {
    id: 'ph005', meal_id: 'm001', meal_title: 'Friday Night Izakaya 🍶', uploader_name: 'Yuki T.', uploader_email: 'yuki.tanaka@yahoo.co.jp',
    url: '/demo/izakaya-1.jpg', caption: 'Sake flight!', likes_count: 56, status: 'featured',
    created_at: '2026-04-18T21:00:00Z', reviewed_at: '2026-04-18T22:00:00Z', reviewed_by: 'Admin',
  },
  {
    id: 'ph006', meal_id: 'm002', meal_title: 'Weekend Hotpot Feast 🫕', uploader_name: 'Alex W.', uploader_email: 'alex.wei@outlook.com',
    url: '/demo/hotpot-1.jpg', caption: null, likes_count: 31, status: 'pending',
    created_at: '2026-04-19T20:00:00Z', reviewed_at: null, reviewed_by: null,
  },
  {
    id: 'ph007', meal_id: 'm002', meal_title: 'Weekend Hotpot Feast 🫕', uploader_name: 'Priya S.', uploader_email: 'priya.s@gmail.com',
    url: '/demo/hotpot-2.jpg', caption: 'Spicy broth lovers unite!', likes_count: 24, status: 'pending',
    created_at: '2026-04-19T20:30:00Z', reviewed_at: null, reviewed_by: null,
  },
  {
    id: 'ph008', meal_id: 'm001', meal_title: 'Friday Night Izakaya 🍶', uploader_name: 'David C.', uploader_email: 'david.chen@hotmail.com',
    url: '/demo/izakaya-2.jpg', caption: 'Best yakitori in BKK', likes_count: 18, status: 'rejected',
    created_at: '2026-04-18T22:00:00Z', reviewed_at: '2026-04-19T08:00:00Z', reviewed_by: 'Admin',
  },
];

// ─── Status Colors ───────────────────────────────────
export const ADMIN_STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  banned: 'bg-red-100 text-red-600',
  suspended: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending: 'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-600',
  resolved: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  dismissed: 'bg-gray-100 text-gray-500',
  approved: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  rejected: 'bg-red-100 text-red-600',
  featured: 'bg-[#FFD700]/20 text-[#B8860B]',
  draft: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-400',
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-gray-100 text-gray-500',
  ongoing: 'bg-yellow-100 text-yellow-700',
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  no_show: 'No Show',
  harassment: 'Harassment',
  inappropriate_behavior: 'Inappropriate Behavior',
  spam: 'Spam / Promotion',
  fake_profile: 'Fake Profile',
  safety_concern: 'Safety Concern',
  other: 'Other',
};

export const CUISINE_EMOJI: Record<string, string> = {
  japanese: '🍣', thai: '🍜', chinese: '🥡', korean: '🍖', italian: '🍕',
  western: '🥩', hotpot: '🫕', bbq: '🔥', buffet: '🍽️', seafood: '🦐',
  dimsum: '🥟', vegetarian: '🥗', other: '🍴',
};
