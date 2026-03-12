import { useState, useEffect } from 'react';
import { dashboardApi } from './api';

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatHours(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function UserStatusCard({ user }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {user.user_picture ? (
            <img src={user.user_picture} alt={user.user_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-500 font-medium">
              {user.user_name?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-800">{user.user_name}</p>
          {user.running ? (
            <p className="text-sm text-gray-500">Working on: {user.task_name}</p>
          ) : (
            <p className="text-sm text-gray-400">Idle</p>
          )}
        </div>
      </div>
      <div className="text-right">
        {user.running ? (
          <>
            <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Working
            </span>
            <p className="text-lg font-mono text-gray-800 mt-1">
              {formatDuration(user.elapsed_seconds)}
            </p>
          </>
        ) : (
          <span className="text-sm text-gray-400">Offline</span>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  const progress = task.max_hours > 0 
    ? Math.min(100, (task.total_tracked_seconds / (task.max_hours * 3600)) * 100)
    : 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-800">{task.name}</h3>
          <p className="text-sm text-gray-500">{task.user_name}</p>
        </div>
        {task.is_running && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            Running
          </span>
        )}
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">{formatHours(task.total_tracked_seconds)}</span>
          <span className="text-gray-400">{task.max_hours}h goal</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <p className="text-sm text-gray-400">
        {formatHours(task.remaining_seconds)} remaining
      </p>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [statsData, usersData, tasksData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getUsersStatus(),
        dashboardApi.getTasks(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setTasks(tasksData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time employee tracking</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">{user.name?.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm text-gray-600">{user.name}</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Employees" 
            value={stats?.total_users || 0}
            color="bg-blue-100"
            icon={<span className="text-blue-600 text-xl">👥</span>}
          />
          <StatCard 
            title="Total Tasks" 
            value={stats?.total_tasks || 0}
            color="bg-purple-100"
            icon={<span className="text-purple-600 text-xl">📋</span>}
          />
          <StatCard 
            title="Currently Working" 
            value={stats?.currently_working || 0}
            color="bg-green-100"
            icon={<span className="text-green-600 text-xl">⏱️</span>}
          />
          <StatCard 
            title="Today's Total" 
            value={formatHours(stats?.today_total_seconds || 0)}
            color="bg-orange-100"
            icon={<span className="text-orange-600 text-xl">📊</span>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Employee Status</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No users found</p>
              ) : (
                users.map(user => (
                  <UserStatusCard key={user.user_id} user={user} />
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks found</p>
              ) : (
                tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
