import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useReportPost } from '@/hooks/useCommunityPosts';
import { Loader2 } from 'lucide-react';

interface ReportDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'სპამი' },
  { value: 'harassment', label: 'შეურაცხყოფა/ჰარასმენტი' },
  { value: 'hate_speech', label: 'სიძულვილის ენა' },
  { value: 'violence', label: 'ძალადობა' },
  { value: 'misinformation', label: 'არასწორი ინფორმაცია' },
  { value: 'inappropriate', label: 'შეუსაბამო კონტენტი' },
  { value: 'other', label: 'სხვა' },
];

export function ReportDialog({ postId, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  
  const reportPost = useReportPost();
  
  const handleSubmit = async () => {
    if (!reason) return;
    
    try {
      await reportPost.mutateAsync({
        postId,
        reason,
        details: details.trim() || undefined
      });
      
      // Reset and close
      setReason('');
      setDetails('');
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>პოსტის დარეპორტება</DialogTitle>
          <DialogDescription>
            აირჩიეთ დარეპორტების მიზეზი. ადმინისტრატორი განიხილავს თქვენს რეპორტს.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div>
            <Label htmlFor="details" className="mb-2 block">
              დამატებითი დეტალები (არასავალდებულო)
            </Label>
            <Textarea
              id="details"
              placeholder="დაწერეთ დამატებითი ინფორმაცია..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={reportPost.isPending}
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || reportPost.isPending}
              className="flex-1"
            >
              {reportPost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  იგზავნება...
                </>
              ) : (
                'გაგზავნა'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
