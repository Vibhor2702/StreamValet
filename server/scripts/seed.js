const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectMongo = require('../config/mongo');
const User = require('../models/user.model');
const Video = require('../models/video.model');
const Comment = require('../models/comment.model');
const { getMetadata } = require('../services/ffmpeg.service');
const { buildUploadPath, buildThumbnailPath, initStorage } = require('../services/storage.service');

async function seed({ ensureConnection = true } = {}) {
  const alreadyConnected = mongoose.connection.readyState === 1;
  if (!alreadyConnected && ensureConnection) {
    await connectMongo();
  }
  initStorage();

  const demoDir = path.resolve(__dirname, '..', '..', 'demo_assets');

  const tenantId = 'pulsegen';
  const seeds = [
    { email: 'admin@pulsegen.io', name: 'Admin User', password: 'admin123', tenantId, role: User.ROLES.ADMIN },
    { email: 'editor@pulsegen.io', name: 'Editor User', password: 'editor123', tenantId, role: User.ROLES.EDITOR },
    { email: 'viewer@pulsegen.io', name: 'Viewer User', password: 'viewer123', tenantId, role: User.ROLES.VIEWER },
  ];

  // Ensure unique index exists
  await User.init();

  for (const seedUser of seeds) {
    const existing = await User.findOne({ email: seedUser.email, tenantId });
    if (existing) {
      existing.password = seedUser.password;
      existing.role = seedUser.role;
      existing.name = seedUser.name;
      await existing.save();
      // eslint-disable-next-line no-console
      console.log(`Updated user: ${seedUser.email}`);
    } else {
      const user = new User(seedUser);
      await user.save();
      // eslint-disable-next-line no-console
      console.log(`Created user: ${seedUser.email}`);
    }
  }

  const admin = await User.findOne({ email: 'admin@pulsegen.io', tenantId });
  const editor = await User.findOne({ email: 'editor@pulsegen.io', tenantId });
  const viewer = await User.findOne({ email: 'viewer@pulsegen.io', tenantId });

  // TASK 1: Cleanup old "Demo Collaboration" entries
  const deleteResult = await Video.deleteMany({ title: { $regex: /Demo Collaboration/i } });
  if (deleteResult.deletedCount > 0) {
    // eslint-disable-next-line no-console
    console.log(`🗑️  Cleaned up ${deleteResult.deletedCount} old "Demo Collaboration" entries`);
  }

  // TASK 1: Ensure "StreamValet Demo" permanent video exists
  let permanentDemo = await Video.findOne({ title: 'StreamValet Demo', tenantId });
  
  if (!permanentDemo) {
    // eslint-disable-next-line no-console
    console.log('🔍 Checking for permanent demo video...');
    // eslint-disable-next-line no-console
    console.log('📁 Demo directory:', demoDir);
    // eslint-disable-next-line no-console
    console.log('📂 Demo directory exists:', fs.existsSync(demoDir));
    
    if (fs.existsSync(demoDir)) {
      // Look for any .mp4 file in demo_assets
      const demoFiles = fs.readdirSync(demoDir).filter(f => f.toLowerCase().endsWith('.mp4'));
      // eslint-disable-next-line no-console
      console.log('🎬 Found demo files:', demoFiles);
      
      const permanentDemoFile = demoFiles.find(f => f.toLowerCase().includes('permanent')) || demoFiles[0];
      
      if (permanentDemoFile) {
        const permanentDemoPath = path.join(demoDir, permanentDemoFile);
        // eslint-disable-next-line no-console
        console.log(`📹 Creating permanent demo video from file: ${permanentDemoFile}`);
    
        const targetFilename = 'streamvalet-demo.mp4';
        const targetPath = buildUploadPath(targetFilename);
        
        // Copy the permanent demo file to uploads
        fs.copyFileSync(permanentDemoPath, targetPath);
        const stats = fs.statSync(targetPath);

        let metadata = { durationSeconds: 60, resolution: { width: 1920, height: 1080 } };
        try {
          metadata = await getMetadata(targetPath);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('FFprobe failed for permanent demo, using defaults:', err.message);
        }

        permanentDemo = new Video({
          tenantId,
          owner: admin?._id || editor?._id,
          title: 'StreamValet Demo',
          description: 'Professional video collaboration platform showcase',
          originalFilename: permanentDemoFile,
          storagePath: targetPath,
          mimeType: 'video/mp4',
          size: stats.size,
          durationSeconds: metadata.durationSeconds || 60,
          resolution: metadata.resolution,
          processingStatus: Video.PROCESSING_STATUS.READY,
          sensitivityStatus: Video.SENSITIVITY_STATUS.SAFE,
          sensitivityConfidence: 100,
          sensitivityReason: 'Professional demo content',
        });

        // Create thumbnail
        const thumbName = `${permanentDemo._id}-thumb.jpg`;
        const thumbPath = buildThumbnailPath(thumbName);
        if (!fs.existsSync(path.dirname(thumbPath))) {
          fs.mkdirSync(path.dirname(thumbPath), { recursive: true });
        }
        if (!fs.existsSync(thumbPath)) {
          fs.writeFileSync(thumbPath, 'Demo thumbnail placeholder');
        }
        permanentDemo.thumbnailPath = thumbPath;

        await permanentDemo.save();
        // eslint-disable-next-line no-console
        console.log('✅ Created permanent demo video: "StreamValet Demo"');
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠️  No .mp4 files found in demo_assets directory');
      }
    } else {
      // Fallback: Create a placeholder entry that users can replace via upload
      // eslint-disable-next-line no-console
      console.log('📝 Demo assets not found, creating placeholder entry');
      console.log('💡 Users can upload their own demo video through the UI');
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Permanent demo video already exists: "StreamValet Demo"');
  }

  // Add demo comments to the permanent demo video
  if (permanentDemo) {
    await Comment.deleteMany({ videoId: permanentDemo._id });

    const commentSeeds = [
      {
        tenantId,
        videoId: permanentDemo._id,
        userId: admin?._id,
        text: 'Kickoff: let us align on intro pacing.',
        timestamp: 4,
      },
      {
        tenantId,
        videoId: permanentDemo._id,
        userId: editor?._id,
        text: 'Need b-roll swap between 10s-15s (sensitivity flag).',
        timestamp: 11,
      },
    ].filter((c) => c.userId);

    if (commentSeeds.length) {
      await Comment.insertMany(commentSeeds);
      // eslint-disable-next-line no-console
      console.log(`Inserted ${commentSeeds.length} demo comments`);
    }
  }

  if (!alreadyConnected) {
    await mongoose.connection.close();
  }
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Seed failed', err);
      return mongoose.connection.close();
    });
}
