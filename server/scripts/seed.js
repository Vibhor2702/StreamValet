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

  const sampleVideos = [
    {
      title: 'Demo Collaboration 1',
      owner: editor?._id || admin?._id,
      originalFilename: 'demo-collab-1.mp4',
      storageFilename: 'demo-collab-1.mp4',
      durationSeconds: 45,
      sensitivitySegments: [{ start: 10, end: 15, reason: 'Simulated sensitive segment' }],
      sensitivityStatus: Video.SENSITIVITY_STATUS.FLAGGED,
      sensitivityReason: 'Simulated sensitive segment',
    },
    {
      title: 'Demo Collaboration 2',
      owner: viewer?._id || editor?._id,
      originalFilename: 'demo-collab-2.mp4',
      storageFilename: 'demo-collab-2.mp4',
      durationSeconds: 28,
      sensitivitySegments: [],
      sensitivityStatus: Video.SENSITIVITY_STATUS.SAFE,
      sensitivityReason: 'Clean sample video',
    },
  ];

  for (const sample of sampleVideos) {
    if (!sample.owner) continue;
    const existingVideo = await Video.findOne({ title: sample.title, tenantId });
    if (existingVideo) {
      // eslint-disable-next-line no-console
      console.log(`Video already exists: ${sample.title}`);
      continue;
    }

    const uploadPath = buildUploadPath(sample.storageFilename);
    if (!fs.existsSync(uploadPath)) {
      fs.writeFileSync(uploadPath, 'Placeholder content for demo video');
    }

    const video = new Video({
      tenantId,
      owner: sample.owner,
      title: sample.title,
      description: 'Sample video for collaboration demo',
      originalFilename: sample.originalFilename,
      storagePath: uploadPath,
      mimeType: 'video/mp4',
      size: Math.max(1024, fs.statSync(uploadPath).size || 0) || 1024,
      durationSeconds: sample.durationSeconds,
      resolution: { width: 1280, height: 720 },
      processingStatus: Video.PROCESSING_STATUS.READY,
      sensitivityStatus: sample.sensitivityStatus,
      sensitivityConfidence: sample.sensitivityStatus === Video.SENSITIVITY_STATUS.FLAGGED ? 90 : 15,
      sensitivityReason: sample.sensitivityReason,
      sensitivitySegments: sample.sensitivitySegments,
    });

    await video.save();
    // eslint-disable-next-line no-console
    console.log(`Created sample video: ${sample.title}`);
  }


  async function ingestDemoAssets({ demoDir, tenantId, owner }) {
    if (!owner) return;
    if (!fs.existsSync(demoDir)) return;

    const files = fs.readdirSync(demoDir).filter((f) => f.toLowerCase().endsWith('.mp4'));
    if (!files.length) return;

    // eslint-disable-next-line no-console
    console.log(`Found ${files.length} demo asset(s), importing...`);

    for (const filename of files) {
      const sourcePath = path.join(demoDir, filename);
      const baseName = filename.replace(/\.[^/.]+$/, '');

      const existing = await Video.findOne({ tenantId, originalFilename: filename });
      if (existing) {
        // eslint-disable-next-line no-console
        console.log(`Skipping existing demo asset: ${filename}`);
        continue;
      }

      let targetName = filename;
      let targetPath = buildUploadPath(targetName);
      let attempt = 1;
      while (fs.existsSync(targetPath)) {
        targetName = `${baseName}-${attempt}.mp4`;
        targetPath = buildUploadPath(targetName);
        attempt += 1;
      }

      fs.copyFileSync(sourcePath, targetPath);
      const stats = fs.statSync(targetPath);

      let metadata = { durationSeconds: 60, resolution: undefined };
      try {
        metadata = await getMetadata(targetPath);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`FFprobe failed for ${filename}, using defaults:`, err.message);
      }

      const video = new Video({
        tenantId,
        owner: owner._id,
        title: baseName,
        description: 'Demo asset imported automatically',
        originalFilename: filename,
        storagePath: targetPath,
        mimeType: 'video/mp4',
        size: Math.max(1024, stats.size || 1024),
        durationSeconds: metadata.durationSeconds || 60,
        resolution: metadata.resolution,
        processingStatus: Video.PROCESSING_STATUS.READY,
        sensitivityStatus: Video.SENSITIVITY_STATUS.SAFE,
        sensitivityConfidence: 90,
      });

      const thumbName = `${video._id}-thumb.jpg`;
      const thumbPath = buildThumbnailPath(thumbName);
      if (!fs.existsSync(path.dirname(thumbPath))) {
        fs.mkdirSync(path.dirname(thumbPath), { recursive: true });
      }
      if (!fs.existsSync(thumbPath)) {
        fs.writeFileSync(thumbPath, 'Demo thumbnail placeholder');
      }
      video.thumbnailPath = thumbPath;

      await video.save();
      // eslint-disable-next-line no-console
      console.log(`Imported demo video: ${filename}`);
    }
  }

  await ingestDemoAssets({ demoDir, tenantId, owner: editor || admin });

  const videos = await Video.find({ tenantId }).sort({ createdAt: -1 }).limit(2);
  const [firstVideo, secondVideo] = videos;

  if (firstVideo && secondVideo) {
    await Comment.deleteMany({ videoId: { $in: [firstVideo._id, secondVideo._id] } });

    const commentSeeds = [
      {
        tenantId,
        videoId: firstVideo._id,
        userId: admin?._id,
        text: 'Kickoff: let us align on intro pacing.',
        timestamp: 4,
      },
      {
        tenantId,
        videoId: firstVideo._id,
        userId: editor?._id,
        text: 'Need b-roll swap between 10s-15s (sensitivity flag).',
        timestamp: 11,
      },
      {
        tenantId,
        videoId: secondVideo._id,
        userId: viewer?._id,
        text: 'Looks clean. Add lower-third branding?',
        timestamp: 6,
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
