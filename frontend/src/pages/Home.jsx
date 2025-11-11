// src/pages/Home.jsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    { icon: '🤖', title: 'AI-Powered Learning', desc: 'Personalized AI tutor for every student' },
    { icon: '🎮', title: 'Interactive Games', desc: 'Learn through fun challenges' },
    { icon: '🏆', title: 'Achievements', desc: 'Earn badges and level up' },
    { icon: '📊', title: 'Track Progress', desc: 'See your learning journey' }
  ];

  const stats = [
    { value: '10K+', label: 'Students' },
    { value: '50+', label: 'Courses' },
    { value: '95%', label: 'Success Rate' },
    { value: '24/7', label: 'AI Support' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 glass-card mx-4 mt-4 rounded-2xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🤖</span>
              <span className="text-white font-bold text-2xl">AI Academy</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="text-white font-semibold px-6 py-2 rounded-xl hover:bg-white/10 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-glow transition-all"
              >
                Start Free
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl mb-6"
            >
              🤖
            </motion.div>

            <h1 className="text-7xl md:text-8xl font-extrabold text-white mb-6 leading-tight">
              Learn AI Like
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-pink-400 bg-clip-text text-transparent">
                Playing a Game
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
              Master Artificial Intelligence through interactive lessons, fun challenges, and AI-powered guidance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-2xl hover:shadow-glow"
              >
                Start Learning Free 🚀
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="glass-card text-white font-bold text-lg px-10 py-4 rounded-2xl hover:bg-white/20"
              >
                Login
              </motion.button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-slate-300 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-white mb-4">
            Why Kids Love Learning Here
          </h2>
          <p className="text-xl text-slate-300">
            Everything you need to master AI in one place
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass-card p-8 rounded-2xl cursor-pointer group"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-300">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-12 rounded-3xl text-center"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="text-7xl mb-6 inline-block"
          >
            🎓
          </motion.div>
          
          <h2 className="text-5xl font-extrabold text-white mb-6">
            Ready to Start?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students learning AI the fun way!
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-2xl hover:shadow-glow"
          >
            Get Started Free 🚀
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-12 text-slate-400">
        <p>© 2024 AI Academy. Made with 💜 for future AI innovators.</p>
      </div>
    </div>
  );
}