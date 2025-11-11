// ================= FILE: backend/models/Quiz.js =================
const mongoose_quiz = require('mongoose');


const quizSchema = new mongoose_quiz.Schema({
course: {
type: mongoose_quiz.Schema.Types.ObjectId,
ref: 'Course',
required: true
},
module: mongoose_quiz.Schema.Types.ObjectId,
lesson: mongoose_quiz.Schema.Types.ObjectId,
title: {
type: String,
required: true
},
description: String,
questions: [{
question: {
type: String,
required: true
},
type: {
type: String,
enum: ['multiple-choice', 'true-false', 'short-answer', 'code'],
default: 'multiple-choice'
},
options: [String], // For multiple choice
correctAnswer: mongoose_quiz.Schema.Types.Mixed,
explanation: String,
points: {
type: Number,
default: 10
},
difficulty: {
type: String,
enum: ['easy', 'medium', 'hard'],
default: 'medium'
}
}],
// Settings
timeLimit: Number, // in minutes
passingScore: {
type: Number,
default: 70
},
attemptsAllowed: {
type: Number,
default: 3
},
shuffleQuestions: {
type: Boolean,
default: false
},
showAnswers: {
type: Boolean,
default: true
}
}, {
timestamps: true
});


module.exports = mongoose_quiz.model('Quiz', quizSchema);