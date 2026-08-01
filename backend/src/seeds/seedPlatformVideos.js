const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');
const logger = require('../config/logger');

const platformVideos = [
  {
    title: 'JavaScript Basics & Modern ES6+ Masterclass',
    description: 'Learn fundamental JavaScript concepts, closures, promises, async/await, and modern ES6 syntax in this comprehensive course.',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    duration: 634,
    category: 'Other',
    source: 'platform',
    views: 14200,
    likes: 1250,
    tags: ['javascript', 'programming', 'webdev']
  },
  {
    title: 'AI & Machine Learning Documentary 2026',
    description: 'Discover how artificial intelligence and deep neural networks are transforming industries, medicine, and human creativity.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    duration: 653,
    category: 'Documentaries',
    source: 'platform',
    views: 28900,
    likes: 3400,
    tags: ['ai', 'technology', 'documentary']
  },
  {
    title: '4K Cinematic Travel Vlog: Swiss Alps Exploration',
    description: 'Breathtaking 4K footage across the snowy peaks, crystal clear lakes, and scenic mountain villages of Switzerland.',
    thumbnail: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    duration: 596,
    category: 'Other',
    source: 'platform',
    views: 18700,
    likes: 2150,
    tags: ['travel', 'nature', 'switzerland']
  },
  {
    title: 'Cyberpunk 2077 Anime & Lo-Fi Chill Beats',
    description: 'Relax and unwind with smooth neon synthwave and lo-fi hip hop beats accompanied by futuristic visualizer aesthetics.',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    duration: 900,
    category: 'Anime',
    source: 'platform',
    views: 45000,
    likes: 5800,
    tags: ['music', 'lofi', 'cyberpunk']
  },
  {
    title: 'TED Talk: The Future of Quantum Computing',
    description: 'Expert insights into quantum qubits, superposition, and how next-gen quantum computers will solve intractable scientific problems.',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4',
    duration: 720,
    category: 'Documentaries',
    source: 'platform',
    views: 31200,
    likes: 2890,
    tags: ['ted', 'science', 'quantum']
  },
  {
    title: 'Sci-Fi Blockbuster Movie Official Trailer 2026',
    description: 'Watch the epic first look trailer for the upcoming sci-fi adventure masterpiece releasing in theaters worldwide.',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    duration: 180,
    category: 'Movies',
    source: 'platform',
    views: 98000,
    likes: 12400,
    tags: ['trailer', 'movie', 'scifi']
  },
  {
    title: 'Deep Ocean Mysteries & Marine Life Showcase',
    description: 'Explore the uncharted depths of the Pacific Ocean and witness rare bioluminescent creatures in their natural habitat.',
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female.mp4',
    duration: 840,
    category: 'Documentaries',
    source: 'platform',
    views: 22400,
    likes: 1950,
    tags: ['ocean', 'wildlife', 'nature']
  },
  {
    title: 'Extreme Mountain Biking & Red Bull Highlights',
    description: 'Adrenaline-pumping downhill mountain bike action featuring world champion riders taking on perilous cliff tracks.',
    thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    duration: 520,
    category: 'Sports',
    source: 'platform',
    views: 39500,
    likes: 4120,
    tags: ['sports', 'biking', 'extreme']
  }
];

const seedPlatformVideos = async () => {
  try {
    const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
    if (!adminUser) {
      logger.warn('[Seed] No user found in database to assign platform video uploader');
      return;
    }

    // Force replace any broken gtv-videos-bucket URLs in database
    const brokenGtvVideos = await Video.find({ videoUrl: { $regex: /gtv-videos-bucket/ } });
    if (brokenGtvVideos.length > 0) {
      for (let i = 0; i < brokenGtvVideos.length; i++) {
        const replacement = platformVideos[i % platformVideos.length];
        brokenGtvVideos[i].videoUrl = replacement.videoUrl;
        brokenGtvVideos[i].source = 'platform';
        await brokenGtvVideos[i].save();
      }
      logger.info(`[Seed] Replaced ${brokenGtvVideos.length} broken gtv-videos-bucket URLs in MongoDB`);
    }

    let seededCount = 0;
    for (const vData of platformVideos) {
      const existing = await Video.findOne({ title: vData.title });
      if (!existing) {
        await Video.create({
          ...vData,
          uploadedBy: adminUser._id
        });
        seededCount++;
      } else if (existing.videoUrl.includes('gtv-videos-bucket')) {
        existing.videoUrl = vData.videoUrl;
        existing.source = 'platform';
        await existing.save();
      }
    }
    if (seededCount > 0) {
      logger.info(`[Seed] Successfully seeded ${seededCount} new platform videos`);
    } else {
      logger.info('[Seed] Platform videos checked and verified');
    }
  } catch (error) {
    logger.error(`[Seed] Error seeding platform videos: ${error.message}`);
  }
};

module.exports = seedPlatformVideos;
