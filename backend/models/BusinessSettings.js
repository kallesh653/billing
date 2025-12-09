const mongoose = require('mongoose');

const businessSettingsSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: true,
    default: 'Juicy'
  },
  shopAddress: {
    type: String,
    default: ''
  },
  shopMobile: {
    type: String,
    default: ''
  },
  shopEmail: {
    type: String,
    default: ''
  },
  gstNumber: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  billPrefix: {
    type: String,
    default: 'BILL'
  },
  billStartNumber: {
    type: Number,
    default: 1
  },
  currentBillNo: {
    type: Number,
    default: 0
  },
  currentOrderNo: {
    type: Number,
    default: 0
  },
  gstEnabled: {
    type: Boolean,
    default: false
  },
  defaultGstPercent: {
    type: Number,
    default: 5
  },
  thermalPrinterSettings: {
    printerName: {
      type: String,
      default: 'ThermalPrinter'
    },
    paperWidth: {
      type: Number,
      default: 48
    },
    enableLogo: {
      type: Boolean,
      default: false
    },
    footerText: {
      type: String,
      default: 'Thank You! Visit Again'
    }
  },
  defaultPermissions: {
    userCanEditPrice: {
      type: Boolean,
      default: false
    },
    userCanGiveDiscount: {
      type: Boolean,
      default: true
    },
    maxUserDiscount: {
      type: Number,
      default: 10
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);
