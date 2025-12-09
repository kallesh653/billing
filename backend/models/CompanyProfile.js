const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  logo: {
    type: String, // URL or base64
  },
  favicon: {
    type: String
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String
  },
  alternatePhone: {
    type: String
  },
  website: {
    type: String
  },
  gstNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  cinNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  address: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    ifscCode: String,
    branchName: String,
    upiId: String,
    qrCode: String // UPI QR code image
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    youtube: String,
    whatsapp: String
  },
  branding: {
    primaryColor: { type: String, default: '#667eea' },
    secondaryColor: { type: String, default: '#764ba2' },
    accentColor: { type: String, default: '#f093fb' },
    fontFamily: { type: String, default: 'Arial' },
    headerBgColor: { type: String, default: '#667eea' },
    headerTextColor: { type: String, default: '#ffffff' }
  },
  invoiceSettings: {
    defaultPrefix: { type: String, default: 'INV' },
    defaultTemplate: {
      type: String,
      enum: ['Classic', 'Modern', 'Minimal', 'Professional', 'Colorful'],
      default: 'Classic'
    },
    showLogo: { type: Boolean, default: true },
    showGST: { type: Boolean, default: true },
    showBankDetails: { type: Boolean, default: true },
    showQRCode: { type: Boolean, default: false },
    showSignature: { type: Boolean, default: false },
    signatureImage: String,
    authorizedSignatory: String,
    defaultTerms: {
      type: String,
      default: '1. Payment is due within 15 days\n2. Please make cheque payable to company name\n3. Goods once sold will not be taken back'
    },
    defaultNotes: String,
    footerText: String,
    showFooter: { type: Boolean, default: true }
  },
  taxSettings: {
    gstEnabled: { type: Boolean, default: true },
    defaultTaxRate: { type: Number, default: 18 },
    cgstRate: { type: Number, default: 9 },
    sgstRate: { type: Number, default: 9 },
    igstRate: { type: Number, default: 18 },
    isComposite: { type: Boolean, default: false },
    compositeRate: { type: Number, default: 1 }
  },
  emailSettings: {
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String,
    fromName: String,
    emailSignature: String,
    defaultSubject: { type: String, default: 'Invoice from {companyName}' },
    defaultBody: String
  },
  smsSettings: {
    provider: { type: String, enum: ['None', 'Twilio', 'MSG91', 'Other'], default: 'None' },
    apiKey: String,
    senderId: String,
    defaultTemplate: String
  },
  homepage: {
    isEnabled: { type: Boolean, default: true },
    heroTitle: String,
    heroSubtitle: String,
    heroImage: String,
    aboutUs: String,
    mission: String,
    vision: String,
    whyChooseUs: [String],
    features: [{
      icon: String,
      title: String,
      description: String
    }],
    gallery: [{
      image: String,
      caption: String,
      order: Number
    }],
    testimonials: [{
      name: String,
      designation: String,
      company: String,
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
      image: String,
      order: Number
    }],
    contactInfo: {
      showMap: { type: Boolean, default: true },
      mapUrl: String,
      googleMapEmbed: String,
      workingHours: String
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
      ogImage: String
    }
  },
  products: [{
    name: String,
    category: String,
    description: String,
    price: Number,
    image: String,
    isActive: { type: Boolean, default: true },
    order: Number,
    features: [String]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Only one company profile should exist
companyProfileSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
