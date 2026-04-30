// Video Configuration
// Add your video URLs here - supports YouTube, Vimeo, or direct video file URLs

export interface VideoConfig {
  id: string;
  title: string;
  description: string;
  thumbnail?: string; // Optional custom thumbnail URL
  url: string; // YouTube/Vimeo URL or direct video file URL
  duration: string;
  category: "wms" | "hazalyze" | "aivision" | "integration";
  type: "youtube" | "vimeo" | "file"; // Video source type
}

export const videoConfigs: VideoConfig[] = [
  {
    id: "1",
    title: "WMS Platform Overview",
    description:
      "Complete warehouse management system capabilities, real-time tracking, and optimization",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with your actual WMS demo video
    duration: "5:32",
    category: "wms",
    type: "youtube",
  },
  {
    id: "2",
    title: "Hazalyze Chemical Safety",
    description:
      "Intelligent chemical storage and compliance management platform demonstration",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with your actual Hazalyze demo video
    duration: "4:15",
    category: "hazalyze",
    type: "youtube",
  },
  {
    id: "3",
    title: "AI Vision Integration",
    description:
      "Computer vision for safety compliance, quality checks, and automation",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with your actual AI Vision demo video
    duration: "6:20",
    category: "aivision",
    type: "youtube",
  },
  {
    id: "4",
    title: "Unified Platform Demo",
    description:
      "See all three systems working together seamlessly in real-time",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with your actual integration demo video
    duration: "8:45",
    category: "integration",
    type: "youtube",
  },
  {
    id: "5",
    title: "Animated Workflow Visualization",
    description:
      "Interactive process mining, route optimization, and root cause analysis with animated workflows",
    url: "/showcase#workflow", // Link to the animated workflow component
    duration: "Interactive",
    category: "integration",
    type: "file",
    thumbnail: "/api/placeholder/800/450",
  },
  {
    id: "6",
    title: "Inbound ASN Visual Manual",
    description:
      "Complete walkthrough of the Inbound ASN module - World-class inbound operations with multi-modal receiving, cross-border processing, advanced quality gates, and real-time tracking",
    url: "/videos/Inbound-ASN-Visual-Manual.mp4",
    duration: "3:30",
    category: "wms",
    type: "file",
    thumbnail: "/videos/inbound-asn-thumbnail.jpg",
  },
  // Add more videos here...
  // Example for local video files:
  // {
  //   id: '5',
  //   title: 'Custom Demo Video',
  //   description: 'Local video file demonstration',
  //   url: '/videos/demo.mp4', // Place video in public/videos/ folder
  //   duration: '3:00',
  //   category: 'wms',
  //   type: 'file',
  // },
];

// Helper function to get video thumbnail
export function getVideoThumbnail(video: VideoConfig): string {
  if (video.thumbnail) {
    return video.thumbnail;
  }

  // Generate YouTube thumbnail URL
  if (video.type === "youtube") {
    const videoId = video.url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    )?.[1];
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  // Generate Vimeo thumbnail URL (requires API call, using placeholder for now)
  if (video.type === "vimeo") {
    return "/api/placeholder/800/450";
  }

  // Default placeholder
  return "/api/placeholder/800/450";
}
