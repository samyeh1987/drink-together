'use client';

import {
  Users,
  UtensilsCrossed,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Store,
  Image as ImageIcon,
} from 'lucide-react';

// Demo stats data
const stats = [
  { label: 'Total Users', value: '2,847', change: '+12.5%', up: true, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Meals', value: '156', change: '+8.3%', up: true, icon: UtensilsCrossed, color: 'from-[#FF6B35] to-[#FF6B6B]', bg: 'bg-orange-50' },
  { label: 'Meals This Week', value: '89', change: '+15.2%', up: true, icon: TrendingUp, color: 'from-[#2EC4B6] to-[#5DD9CE]', bg: 'bg-teal-50' },
  { label: 'New Users Today', value: '24', change: '-3.1%', up: false, icon: UserPlus, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
];

const recentMeals = [
  { id: '1', title: 'Friday Night Izakaya 🍶', restaurant: 'Ninja Izakaya', host: 'Sarah K.', participants: 4, max: 8, status: 'open', datetime: '2026-04-18T19:00' },
  { id: '2', title: 'Weekend Hotpot Feast 🫕', restaurant: 'Haidilao', host: 'Alex W.', participants: 6, max: 10, status: 'confirmed', datetime: '2026-04-19T18:30' },
  { id: '3', title: 'Korean BBQ Night 🔥', restaurant: 'Maple House', host: 'Mike L.', participants: 3, max: 8, status: 'open', datetime: '2026-04-20T19:30' },
  { id: '4', title: 'Dim Sum Brunch 🥟', restaurant: 'Tim Ho Wan', host: 'David C.', participants: 2, max: 6, status: 'pending', datetime: '2026-04-21T09:00' },
  { id: '5', title: 'Thai Cooking Class 🍛', restaurant: 'Silom Studio', host: 'Noy S.', participants: 8, max: 8, status: 'closed', datetime: '2026-04-17T11:00' },
];

const recentUsers = [
  { name: 'Emma T.', email: 'emma@example.com', meals: 5, credit: 128, joined: '2026-04-15', avatar: null },
  { name: 'Carlos R.', email: 'carlos@example.com', meals: 2, credit: 85, joined: '2026-04-14', avatar: null },
  { name: 'Yuki T.', email: 'yuki@example.com', meals: 8, credit: 156, joined: '2026-04-13', avatar: null },
  { name: 'Lisa M.', email: 'lisa@example.com', meals: 1, credit: 100, joined: '2026-04-12', avatar: null },
  { name: 'Marco B.', email: 'marco@example.com', meals: 3, credit: 95, joined: '2026-04-11', avatar: null },
];

const activityLog = [
  { type: 'meal_created', text: 'Sarah K. created "Friday Night Izakaya"', time: '2 hours ago' },
  { type: 'user_joined', text: 'Alex W. joined "Weekend Hotpot"', time: '3 hours ago' },
  { type: 'meal_confirmed', text: 'Dim Sum Brunch reached min participants', time: '5 hours ago' },
  { type: 'new_user', text: 'Emma T. signed up via Google', time: '6 hours ago' },
  { type: 'report', text: 'New report submitted for "Tacos Night"', time: '8 hours ago' },
  { type: 'meal_cancelled', text: 'Yuki T. cancelled "Ramen Night"', time: '12 hours ago' },
];

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  closed: 'bg-purple-100 text-purple-700',
  pending: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening on EatTogether.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stat.up ? (
                  <ArrowUpRight className="w-4 h-4 text-[#2EC4B6]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-[#FF6B6B]" />
                )}
                <span className={`text-xs font-semibold ${stat.up ? 'text-[#2EC4B6]' : 'text-[#FF6B6B]'}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-gray-400">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" />
            <span className="text-xs text-gray-500 font-medium">Confirmation Rate</span>
          </div>
          <p className="text-xl font-bold text-gray-800">78.5%</p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
            <div className="h-full bg-[#2EC4B6] rounded-full" style={{ width: '78.5%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-[#FF6B6B]" />
            <span className="text-xs text-gray-500 font-medium">Cancellation Rate</span>
          </div>
          <p className="text-xl font-bold text-gray-800">8.2%</p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
            <div className="h-full bg-[#FF6B6B] rounded-full" style={{ width: '8.2%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-[#FFD700]" />
            <span className="text-xs text-gray-500 font-medium">Partner Restaurants</span>
          </div>
          <p className="text-xl font-bold text-gray-800">4</p>
          <p className="text-xs text-gray-400 mt-1">6 active deal meals</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">Gallery Photos</span>
          </div>
          <p className="text-xl font-bold text-gray-800">247</p>
          <p className="text-xs text-gray-400 mt-1">1,892 total likes</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Meals */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Recent Meals</h2>
            <span className="text-xs text-[#FF6B35] font-medium cursor-pointer hover:underline">View all</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentMeals.map((meal) => (
              <div key={meal.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-lg">{meal.title.split(' ').pop()}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{meal.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {meal.restaurant} · Host: {meal.host} · {meal.participants}/{meal.max} people
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[meal.status] || 'bg-gray-100 text-gray'}`}>
                  {meal.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">New Users</h2>
            <span className="text-xs text-[#FF6B35] font-medium cursor-pointer hover:underline">View all</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.map((user) => (
              <div key={user.email} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FF6B6B]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#FF6B35]">{user.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-600">{user.credit}</p>
                  <p className="text-[10px] text-gray-400">credits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">Activity Log</h2>
          <span className="text-xs text-[#FF6B35] font-medium cursor-pointer hover:underline">View all</span>
        </div>
        <div className="divide-y divide-gray-50">
          {activityLog.map((log, i) => {
            const iconMap: Record<string, { icon: typeof Users; color: string }> = {
              meal_created: { icon: UtensilsCrossed, color: 'bg-[#FF6B35]/10 text-[#FF6B35]' },
              user_joined: { icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
              meal_confirmed: { icon: CheckCircle2, color: 'bg-[#2EC4B6]/10 text-[#2EC4B6]' },
              new_user: { icon: Users, color: 'bg-purple-50 text-purple-600' },
              report: { icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
              meal_cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-500' },
            };
            const { icon: Icon, color } = iconMap[log.type] || { icon: Clock, color: 'bg-gray-100 text-gray-500' };
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="flex-1 text-sm text-gray-600">{log.text}</p>
                <span className="text-xs text-gray-400 flex-shrink-0">{log.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
