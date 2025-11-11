// ================= FILE: backend/models/QuizAttempt.js =================
const mongoose_quizAttempt = require('mongoose');


const quizAttemptSchema = new mongoose_quizAttempt.Schema({
user: {
type: mongoose_quizAttempt.Schema.Types.ObjectId,
ref: 'User',
required: true
},
quiz: {
type: mongoose_quizAttempt.Schema.Types.ObjectId,
ref: 'Quiz',
required: true
},
course: {
type: mongoose_quizAttempt.Schema.Types.ObjectId,
ref: 'Course'
},
// Answers
answers: [{
questionId: mongoose_quizAttempt.Schema.Types.ObjectId,
userAnswer: mongoose_quizAttempt.Schema.Types.Mixed,
isCorrect: Boolean,
pointsEarned: Number
}],
// Score
score: {
type: Number,
required: true
},
totalPoints: Number,
percentage: Number,
passed: {
type: Boolean,
default: false
},
// Time
timeSpent: Number, // in seconds
startedAt: {
type: Date,
default: Date.now
},
completedAt: {
type: Date,
default: Date.now
}
}, {
timestamps: true
});


quizAttemptSchema.index({ user: 1, quiz: 1 });


module.exports = mongoose_quizAttempt.model('QuizAttempt', quizAttemptSchema);