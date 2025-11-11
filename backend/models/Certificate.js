
// ==================================================
// backend/models/Certificate.js
// ==================================================
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Certificate Details
  certificateId: {
    type: String,
    unique: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  
  // Performance
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'Pass'],
    default: 'Pass'
  },
  completionTime: Number, // days taken to complete
  
  // Verification
  verified: {
    type: Boolean,
    default: true
  },
  verificationUrl: String,
  
  // Files
  pdfUrl: String,
  imageUrl: String,
  
  // Skills
  skillsAcquired: [String],
  
  // Instructor Signature
  instructorName: String,
  instructorSignature: String
}, {
  timestamps: true
});

// Generate unique certificate ID before saving
certificateSchema.pre('save', async function(next) {
  if (!this.certificateId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    this.certificateId = `CERT-${timestamp}-${random}`;
    this.verificationUrl = `${process.env.FRONTEND_URL}/verify/${this.certificateId}`;
  }
  next();
});

certificateSchema.index({ certificateId: 1 }, { unique: true });
certificateSchema.index({ user: 1, course: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);
module.exports =  Certificate;