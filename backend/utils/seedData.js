// backend/utils/seedData.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB Error:', err);
    process.exit(1);
  });

// Sample courses data
const sampleCourses = [
  {
    title: "Introduction to Artificial Intelligence",
    description: "Learn what AI is and how it's changing our world! Perfect for beginners.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600",
    category: "AI Basics",
    difficulty: "beginner",
    ageGroup: "8-10",
    isPublished: true,
    tags: ["AI", "beginner", "fundamentals"],
    skills: ["Understanding AI", "Pattern Recognition", "Basic Concepts"],
    modules: [
      {
        title: "What is AI?",
        description: "Understanding the basics of Artificial Intelligence",
        order: 1,
        icon: "🤖",
        lessons: [
          {
            title: "AI in Everyday Life",
            description: "Discover how AI is all around us!",
            type: "video",
            content: "AI helps us in many ways every day. From voice assistants like Siri and Alexa to recommendations on YouTube and Netflix, AI is everywhere!",
            videoUrl: "https://www.youtube.com/watch?v=2ePf9rue1Ao",
            duration: 10,
            order: 1
          },
          {
            title: "How Computers Think",
            type: "text",
            content: `# How Computers Learn to Think\n\nComputers don't think like humans, but they can learn patterns!\n\n## Just like you learn:\n- When you see a dog many times, you learn what a dog looks like\n- Computers do the same by looking at thousands of pictures\n\n## Pattern Recognition\nAI looks for patterns in data, just like when you solve a puzzle!`,
            duration: 8,
            order: 2
          },
          {
            title: "Try It: AI Image Recognizer",
            type: "ai-playground",
            content: "Use our AI playground to train a model that recognizes your drawings!",
            aiPlayground: {
              type: "image-classifier"
            },
            duration: 15,
            order: 3
          }
        ]
      },
      {
        title: "Types of AI",
        description: "Explore different kinds of AI",
        order: 2,
        icon: "🎯",
        lessons: [
          {
            title: "Narrow AI vs General AI",
            type: "text",
            content: `# Types of AI\n\n## Narrow AI (Weak AI)\n- Good at ONE specific task\n- Examples: Chess computers, Siri, Face recognition\n- This is what we have today!\n\n## General AI (Strong AI)\n- Can do MANY tasks like humans\n- Can learn anything a human can\n- We don't have this yet!`,
            duration: 12,
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: "Machine Learning for Kids",
    description: "Discover how machines learn from data and make predictions!",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600",
    category: "Machine Learning",
    difficulty: "beginner",
    ageGroup: "11-13",
    isPublished: true,
    tags: ["ML", "data", "learning"],
    skills: ["Data Analysis", "Training Models", "Making Predictions"],
    modules: [
      {
        title: "What is Machine Learning?",
        order: 1,
        icon: "🧠",
        lessons: [
          {
            title: "Teaching Computers to Learn",
            type: "text",
            content: `# Machine Learning Magic! 🎯\n\n## What is Machine Learning?\nIt's like teaching a computer to learn from examples!\n\n### Example: Teaching AI to recognize cats\n1. Show it 1000 pictures of cats\n2. Show it 1000 pictures of dogs\n3. Now it can tell them apart!`,
            duration: 15,
            order: 1
          },
          {
            title: "Train Your First Model",
            type: "ai-playground",
            content: "Let's train a model to recognize happy and sad faces!",
            aiPlayground: {
              type: "sentiment-analyzer"
            },
            duration: 20,
            order: 2
          }
        ]
      }
    ]
  },
  {
    title: "Computer Vision: Teaching AI to See",
    description: "Explore how AI can understand images and videos!",
    thumbnail: "https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=600",
    category: "Computer Vision",
    difficulty: "intermediate",
    ageGroup: "14-16",
    isPublished: true,
    tags: ["vision", "images", "detection"],
    skills: ["Image Recognition", "Object Detection", "Visual Understanding"],
    modules: [
      {
        title: "How Computers See",
        order: 1,
        icon: "👁️",
        lessons: [
          {
            title: "Pixels and Images",
            type: "text",
            content: `# How Computers See Images 👁️\n\n## What You See vs What Computers See:\n- **You see**: A cute cat!\n- **Computer sees**: Numbers! Lots of numbers!\n\n## Pixels:\nImages are made of tiny squares called pixels.\nEach pixel has numbers for:\n- Red (0-255)\n- Green (0-255)\n- Blue (0-255)`,
            duration: 12,
            order: 1
          }
        ]
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    
    console.log('✅ Cleared old data\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'Admin Teacher',
      email: 'admin@ailms.com',
      password: 'admin123',
      role: 'admin',
      points: 1000,
      level: 10
    });
    console.log('✅ Admin created\n');

    // Create sample student
    console.log('👤 Creating sample student...');
    const student = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'student123',
      role: 'student',
      age: 12,
      grade: '7th',
      points: 100,
      level: 2
    });
    console.log('✅ Student created\n');

    // Create courses
    console.log('📚 Creating courses...');
    const coursesWithInstructor = sampleCourses.map(course => ({
      ...course,
      instructor: admin._id
    }));

    const courses = await Course.insertMany(coursesWithInstructor);
    console.log(`✅ Created ${courses.length} courses\n`);

    // Create sample quiz
    console.log('📝 Creating sample quiz...');
    const quiz = await Quiz.create({
      course: courses[0]._id,
      module: courses[0].modules[0]._id,
      title: "AI Basics Quiz",
      description: "Test your knowledge of AI fundamentals!",
      questions: [
        {
          question: "What does AI stand for?",
          type: "multiple-choice",
          options: [
            "Artificial Intelligence",
            "Animal Intelligence",
            "Automatic Information",
            "Advanced Internet"
          ],
          correctAnswer: "Artificial Intelligence",
          explanation: "AI stands for Artificial Intelligence - computers that can think and learn!",
          points: 10,
          difficulty: "easy"
        },
        {
          question: "Which of these uses AI?",
          type: "multiple-choice",
          options: [
            "Netflix recommendations",
            "Calculator",
            "Light switch",
            "Pencil"
          ],
          correctAnswer: "Netflix recommendations",
          explanation: "Netflix uses AI to learn what you like and suggest shows!",
          points: 10,
          difficulty: "easy"
        },
        {
          question: "Can AI learn from mistakes?",
          type: "true-false",
          options: ["True", "False"],
          correctAnswer: "True",
          explanation: "Yes! AI can learn from mistakes and improve, just like you!",
          points: 10,
          difficulty: "easy"
        }
      ],
      passingScore: 70,
      timeLimit: 10
    });
    console.log('✅ Quiz created\n');

    // Summary
    console.log('\n🎉 ========================================');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('🎉 ========================================\n');
    
    console.log('📊 Created:');
    console.log(`   - 2 Users (1 Admin, 1 Student)`);
    console.log(`   - ${courses.length} Courses`);
    console.log(`   - 1 Quiz\n`);
    
    console.log('🔐 Login Credentials:\n');
    console.log('   👨‍💼 Admin:');
    console.log('      Email: admin@ailms.com');
    console.log('      Password: admin123\n');
    console.log('   👨‍🎓 Student:');
    console.log('      Email: student@test.com');
    console.log('      Password: student123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();