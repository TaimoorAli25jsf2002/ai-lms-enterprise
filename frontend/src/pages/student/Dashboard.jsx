// src/pages/student/Dashboard.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get('/api/courses/my/enrolled');
      setEnrolledCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      icon: '📚', 
      label: 'Courses Enrolled', 
      value: enrolledCourses.length,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: '🏆', 
      label: 'Points Earned', 
      value: user?.points || 0,
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      icon: '🔥', 
      label: 'Day Streak', 
      value: user?.streak?.count || 0,
      color: 'from-red-500 to-pink-500'
    },
    { 
      icon: '⭐', 
      label: 'Badges', 
      value: user?.badges?.length || 0,
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Welcome back, <span className="gradient-text">{user?.name}</span>! 👋
          </h1>
          <p className="text-slate-600 text-lg">
            Ready to continue your AI learning journey?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card p-6 rounded-2xl cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-3xl shadow-lg`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/courses')}
            className="glass-card p-6 rounded-2xl text-left hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Explore Courses
            </h3>
            <p className="text-slate-600">
              Discover new AI & ML courses
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/achievements')}
            className="glass-card p-6 rounded-2xl text-left hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-3">🎖️</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Achievements
            </h3>
            <p className="text-slate-600">
              View your badges & rewards
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/leaderboard')}
            className="glass-card p-6 rounded-2xl text-left hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Leaderboard
            </h3>
            <p className="text-slate-600">
              See global rankings
            </p>
          </motion.button>
        </div>

        {/* Continue Learning Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              Continue Learning
            </h2>
            {enrolledCourses.length > 0 && (
              <button
                onClick={() => navigate('/my-learning')}
                className="text-primary-600 font-semibold hover:underline"
              >
                View All →
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="spinner"></div>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                No Courses Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Start your AI learning journey by enrolling in a course!
              </p>
              <button
                onClick={() => navigate('/courses')}
                className="btn-primary"
              >
                Explore Courses
              </button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.slice(0, 3).map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/courses/${course._id}`)}
                >
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-bold text-primary-600">
                          {course.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <button className="btn-primary w-full">
                      Continue Learning →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* AI Tip of the Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                AI Tip of the Day
              </h3>
              <p className="text-slate-700">
                Did you know? Machine Learning is like teaching a computer by showing it examples! 
                Just like you learned to recognize animals by seeing many pictures, 
                AI learns patterns from data to make smart decisions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}