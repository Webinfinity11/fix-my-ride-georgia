
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Image, Video, File, X } from 'lucide-react';

interface ChatFileUploadProps {
  onFileUploaded: (fileUrl: string, fileType: 'image' | 'video' | 'file', fileName: string) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  type: 'image' | 'video' | 'file';
  preview?: string;
}

export const ChatFileUpload: React.FC<ChatFileUploadProps> = ({ onFileUploaded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'image' | 'video' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const fileType = getFileType(file);
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        type: fileType,
        preview: fileType === 'image' ? URL.createObjectURL(file) : undefined
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);
      uploadFile(uploadingFile);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (uploadingFile: UploadingFile) => {
    try {
      const { file, type } = uploadingFile;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading file:', file.name, 'to path:', filePath);

      // Update progress to 50% when starting upload
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file ? { ...f, progress: 50 } : f
        )
      );

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Update progress to 100%
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file ? { ...f, progress: 100 } : f
        )
      );

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Remove from uploading files after a short delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.file !== file));
      }, 1000);
      
      // Call callback with uploaded file info
      onFileUploaded(publicUrl, type, file.name);
      
      toast.success(`${file.name} წარმატებით აიტვირთა`);

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`ფაილის ატვირთვისას შეცდომა: ${error.message}`);
      
      // Remove from uploading files on error
      setUploadingFiles(prev => prev.filter(f => f.file !== uploadingFile.file));
    }
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  const getIcon = (type: 'image' | 'video' | 'file') => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="flex-shrink-0"
      >
        <Upload className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ფაილის ატვირთვა</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.click();
                  }
                }}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Image className="h-6 w-6 mb-2" />
                <span className="text-xs">ფოტო</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'video/*';
                    fileInputRef.current.click();
                  }
                }}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Video className="h-6 w-6 mb-2" />
                <span className="text-xs">ვიდეო</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = '*/*';
                    fileInputRef.current.click();
                  }
                }}
                className="flex flex-col items-center p-4 h-auto"
              >
                <File className="h-6 w-6 mb-2" />
                <span className="text-xs">ფაილი</span>
              </Button>
            </div>

            {uploadingFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">მიმდინარე ატვირთვები:</h4>
                {uploadingFiles.map((uploadingFile, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getIcon(uploadingFile.type)}
                        <span className="text-sm font-medium truncate">
                          {uploadingFile.file.name}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeUploadingFile(uploadingFile.file)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {uploadingFile.preview && (
                      <img 
                        src={uploadingFile.preview} 
                        alt="Preview" 
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{Math.round(uploadingFile.progress)}%</span>
                        <span>{(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <Progress value={uploadingFile.progress} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
