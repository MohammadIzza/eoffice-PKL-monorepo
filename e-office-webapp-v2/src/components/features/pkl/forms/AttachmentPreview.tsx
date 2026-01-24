import React, { useCallback, useMemo } from 'react';
import { FileText, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentPreviewProps {
  attachments: File[];
  expandedAttachments: Record<number, boolean>;
  onToggle: (index: number) => void;
}

export const AttachmentPreview = React.memo(function AttachmentPreview({
  attachments,
  expandedAttachments,
  onToggle,
}: AttachmentPreviewProps) {
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, []);

  const getFileIcon = useCallback((file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-destructive" />;
    }
    return <ImageIcon className="w-5 h-5 text-primary" />;
  }, []);

  const getFileIconBg = useCallback((file: File) => {
    if (file.type === 'application/pdf') {
      return 'bg-destructive/10';
    }
    return 'bg-primary/10';
  }, []);

  const handleToggle = useCallback((index: number) => {
    onToggle(index);
  }, [onToggle]);

  if (attachments.length === 0) {
    return (
      <div className="p-5 text-center text-sm text-muted-foreground">
        Tidak ada lampiran
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {attachments.map((file, index) => {
        const isExpanded = expandedAttachments[index];
        const category = (file as any).category || 'tambahan';
        const categoryLabel = 
          category === 'proposal' ? 'Proposal' :
          category === 'ktm' ? 'KTM' :
          'Tambahan';

        return (
          <div
            key={index}
            className="w-full flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${getFileIconBg(file)} shrink-0`}>
                {getFileIcon(file)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {categoryLabel}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle(index)}
              className="shrink-0"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        );
      })}
    </div>
  );
});
