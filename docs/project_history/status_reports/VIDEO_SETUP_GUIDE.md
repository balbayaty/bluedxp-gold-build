# Video Showcase Setup Guide

## 📹 How to Add Videos to the Showcase

The video showcase supports three types of video sources:

### 1. YouTube Videos (Recommended)

1. Upload your videos to YouTube (public or unlisted)
2. Open `app/showcase/config/videos.ts`
3. Update the `url` field with your YouTube video URL:

```typescript
{
  id: '1',
  title: 'WMS Platform Overview',
  description: 'Your description here',
  url: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', // Replace with your video
  duration: '5:32',
  category: 'wms',
  type: 'youtube',
}
```

**Benefits:**
- Automatic thumbnail generation
- No storage needed on your server
- Built-in video player controls
- Analytics available

### 2. Vimeo Videos

1. Upload your videos to Vimeo
2. Update the config file:

```typescript
{
  id: '2',
  title: 'Hazalyze Demo',
  url: 'https://vimeo.com/YOUR_VIDEO_ID',
  type: 'vimeo',
  // ... other fields
}
```

### 3. Local Video Files

1. Place your video files in the `public/videos/` folder:
   ```
   public/
     videos/
       wms-demo.mp4
       hazalyze-demo.mp4
       aivision-demo.mp4
   ```

2. Update the config file:

```typescript
{
  id: '3',
  title: 'Local Demo Video',
  url: '/videos/wms-demo.mp4', // Path relative to public folder
  type: 'file',
  thumbnail: '/videos/wms-thumbnail.jpg', // Optional custom thumbnail
  // ... other fields
}
```

**Supported formats:** MP4, WebM, OGG

## 🎬 Video Categories

- `wms` - Warehouse Management System videos
- `hazalyze` - Hazalyze chemical safety platform videos
- `aivision` - AI Vision integration videos
- `integration` - Unified platform integration videos

## 📝 Example Configuration

```typescript
export const videoConfigs: VideoConfig[] = [
  {
    id: '1',
    title: 'WMS Platform Overview',
    description: 'Complete warehouse management system capabilities',
    url: 'https://www.youtube.com/watch?v=abc123xyz',
    duration: '5:32',
    category: 'wms',
    type: 'youtube',
  },
  {
    id: '2',
    title: 'Hazalyze Chemical Safety',
    description: 'Intelligent chemical storage and compliance',
    url: '/videos/hazalyze-demo.mp4',
    duration: '4:15',
    category: 'hazalyze',
    type: 'file',
    thumbnail: '/videos/hazalyze-thumb.jpg',
  },
  // Add more videos...
]
```

## 🎨 Custom Thumbnails

You can add custom thumbnails for any video:

```typescript
{
  thumbnail: '/images/video-thumbnails/wms-thumb.jpg',
  // ... other fields
}
```

Place thumbnails in `public/images/video-thumbnails/` folder.

## ✅ Best Practices

1. **Video Quality:** Use HD (720p minimum) or Full HD (1080p) for best results
2. **Duration:** Keep videos between 2-10 minutes for optimal engagement
3. **Thumbnails:** Create eye-catching thumbnails (1280x720 recommended)
4. **Descriptions:** Write clear, concise descriptions
5. **Categories:** Use appropriate categories for better organization

## 🔧 Troubleshooting

**Video not playing?**
- Check that the URL is correct
- For YouTube/Vimeo, ensure the video is public or unlisted
- For local files, verify the file exists in `public/videos/`

**Thumbnail not showing?**
- YouTube thumbnails are generated automatically
- For local videos, add a custom thumbnail URL
- Check that the thumbnail path is correct

**Video player not loading?**
- Ensure `react-player` is installed: `npm install react-player`
- Check browser console for errors
- Verify the video URL is accessible

## 📦 File Structure

```
hazalyze-asn-module/
├── app/
│   └── showcase/
│       ├── config/
│       │   └── videos.ts          # Video configuration
│       └── components/
│           └── VideoShowcase.tsx  # Video component
├── public/
│   └── videos/                     # Local video files
│       ├── wms-demo.mp4
│       ├── hazalyze-demo.mp4
│       └── ...
└── ...
```

## 🚀 Quick Start

1. Edit `app/showcase/config/videos.ts`
2. Replace the placeholder URLs with your actual video URLs
3. Save the file
4. Refresh your browser
5. Click on any video to play it!

---

**Need help?** Check the component code in `app/showcase/components/VideoShowcase.tsx` for implementation details.



