
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChatRoom {
  id: string;
  name: string | null;
  type: 'direct' | 'channel';
  description?: string | null;
  is_public: boolean;
}

interface ChatRoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoom: ChatRoom | null;
  formData: {
    name: string;
    description: string;
    type: 'direct' | 'channel';
    is_public: boolean;
  };
  onFormDataChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ChatRoomForm: React.FC<ChatRoomFormProps> = ({
  open,
  onOpenChange,
  editingRoom,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  loading = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingRoom ? "ჩატის რედაქტირება" : "ახალი ჩატის შექმნა"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">სახელი</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="ჩატის სახელი"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="ჩატის აღწერა (არასავალდებულო)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">ტიპი</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'direct' | 'channel') => 
                onFormDataChange({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="channel">არხი</SelectItem>
                <SelectItem value="direct">პირადი ჩატი</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => onFormDataChange({ ...formData, is_public: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_public">საჯარო ჩატი</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'შენახვა...' : (editingRoom ? "განახლება" : "შექმნა")}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              გაუქმება
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
