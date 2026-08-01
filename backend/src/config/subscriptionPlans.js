const SUBSCRIPTION_PLANS = {
  Free: {
    name: 'Free',
    price: 0,
    downloadLimit: 1,
    ads: true,
    quality: '720p',
    features: [
      '1 Download per day',
      '720p Standard Streaming',
      'Standard Watch Time',
      'Supported by Ads'
    ]
  },
  Bronze: {
    name: 'Bronze',
    price: 99,
    downloadLimit: 5,
    ads: false,
    quality: 'HD 1080p',
    features: [
      '5 Downloads per day',
      '1080p HD Streaming',
      'Ad-Free Viewing',
      'Extended Watch Time'
    ]
  },
  Silver: {
    name: 'Silver',
    price: 299,
    downloadLimit: 15,
    ads: false,
    quality: 'Full HD 1080p',
    features: [
      '15 Downloads per day',
      'Full HD 1080p Streaming',
      'Ad-Free Viewing',
      'Unlimited Watch Time',
      'Priority Watch Party Rooms'
    ]
  },
  Gold: {
    name: 'Gold',
    price: 599,
    downloadLimit: 100,
    ads: false,
    quality: '4K Ultra HD',
    features: [
      '100 Downloads per day',
      '4K Ultra HD + HDR Streaming',
      'Ad-Free Viewing',
      'Unlimited Watch Time',
      'VIP Watch Party Rooms',
      '24/7 Priority Support'
    ]
  }
};

module.exports = SUBSCRIPTION_PLANS;
