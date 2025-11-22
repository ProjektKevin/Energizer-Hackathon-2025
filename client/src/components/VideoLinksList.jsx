import { Card } from "@/components/ui/card";
import { ExternalLink, Video } from "lucide-react";

function VideoLinksList({ links }) {
  if (!links || links.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <p>No video links found.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 min-h-[300px]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Video Resources</h3>
        </div>

        <div className="space-y-3">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800 group-hover:text-blue-600">
                  {link.title}
                </p>
                {link.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {link.description}
                  </p>
                )}
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 ml-3" />
            </a>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default VideoLinksList;