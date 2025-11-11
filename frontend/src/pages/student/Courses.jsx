// src/pages/student/Courses.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    ageGroup: '',
    search: ''
  });

  const categories = ['AI Basics', 'Machine Learning', 'Neural Networks', 'Computer Vision', 'NLP', 'Robotics'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const ageGroups = ['8-10', '11-13', '14-16', '17+'];

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`/api/courses?${params}`);
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Explore <span className="gradient-text">AI Courses</span> 🚀
          </h1>
          <p className="text-slate-600 text-lg">
            Discover amazing courses and start your learning journey!
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl mb-8"
        >
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-4">
              <input
                type="text"
                placeholder="🔍 Search courses..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-modern"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-modern"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="input-modern"
              >
                <option value="">All Levels</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Group */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Age Group
              </label>
              <select
                value={filters.ageGroup}
                onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
                className="input-modern"
              >
                <option value="">All Ages</option>
                {ageGroups.map(age => (
                  <option key={age} value={age}>{age} years</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(filters.category || filters.difficulty || filters.ageGroup || filters.search) && (
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ category: '', difficulty: '', ageGroup: '', search: '' })}
                  className="btn-outline w-full"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Results Count */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-slate-600"
          >
            Found <span className="font-bold text-primary-600">{courses.length}</span> courses
          </motion.div>
        )}

        {/* Courses Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-2xl text-center"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No Courses Found
            </h3>
            <p className="text-slate-600 mb-6">
              Try different filters to find more courses!
            </p>
            <button
              onClick={() => setFilters({ category: '', difficulty: '', ageGroup: '', search: '' })}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all"
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                {/* Course Thumbnail */}
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`badge ${difficultyColors[course.difficulty]}`}>
                      {course.difficulty}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge badge-primary text-xs">
                      {course.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      Ages {course.ageGroup}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Info */}
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <span>📚 {course.modules?.length || 0} modules</span>
                    <span>👥 {course.enrolledStudents?.length || 0} students</span>
                  </div>

                  {/* Rating */}
                  {course.rating?.average > 0 && (
                    <div className="flex items-center gap-1 mb-4">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-bold">{course.rating.average}</span>
                      <span className="text-slate-500 text-sm">
                        ({course.rating.count} reviews)
                      </span>
                    </div>
                  )}

                  <button className="btn-primary w-full">
                    View Course
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}