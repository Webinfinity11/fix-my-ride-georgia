import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarCog, Settings, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BookingSettings {
  id?: string;
  booking_enabled: boolean;
  maintenance_message: string;
  max_advance_days: number;
  min_advance_hours: number;
  booking_fee_percentage: number;
  auto_confirm_bookings: boolean;
}

const BookingManagement = () => {
  const [settings, setSettings] = useState<BookingSettings>({
    booking_enabled: true,
    maintenance_message: "",
    max_advance_days: 30,
    min_advance_hours: 2,
    booking_fee_percentage: 0,
    auto_confirm_bookings: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading booking settings:', error);
        toast.error('შეცდომა პარამეტრების ჩატვირთვისას');
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading booking settings:', error);
      toast.error('შეცდომა პარამეტრების ჩატვირთვისას');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('booking_settings')
        .upsert({
          ...settings,
          id: settings.id || '1', // Use fixed ID for singleton
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving booking settings:', error);
        toast.error('შეცდომა პარამეტრების შენახვისას');
        return;
      }

      toast.success('პარამეტრები წარმატებით შენახულია');
    } catch (error) {
      console.error('Error saving booking settings:', error);
      toast.error('შეცდომა პარამეტრების შენახვისას');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCog className="h-6 w-6" />
          ჯავშნების მართვა
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ძირითადი პარამეტრები
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">ჯავშნების სისტემა</Label>
                <p className="text-sm text-muted-foreground">
                  ჩართეთ ან გამორთეთ მთელ საიტზე ჯავშნების ფუნქცია
                </p>
              </div>
              <Switch
                checked={settings.booking_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, booking_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">ავტომატური დადასტურება</Label>
                <p className="text-sm text-muted-foreground">
                  ჯავშნების ავტომატური დადასტურება მექანიკოსის მიერ
                </p>
              </div>
              <Switch
                checked={settings.auto_confirm_bookings}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_confirm_bookings: checked })
                }
              />
            </div>

            {!settings.booking_enabled && (
              <div className="space-y-2">
                <Label htmlFor="maintenance-message">შეტყობინება მომხმარებლებისთვის</Label>
                <Textarea
                  id="maintenance-message"
                  placeholder="მიუთითეთ შეტყობინება, რომელიც გამოჩნდება ჯავშნების გამორთვის დროს..."
                  value={settings.maintenance_message}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenance_message: e.target.value })
                  }
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              ჯავშნების წესები
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-days">მაქსიმალური წინასწარი ჯავშნის დღეები</Label>
              <input
                id="max-days"
                type="number"
                min="1"
                max="365"
                value={settings.max_advance_days}
                onChange={(e) =>
                  setSettings({ ...settings, max_advance_days: parseInt(e.target.value) || 30 })
                }
                className="w-full px-3 py-2 border border-input rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-hours">მინიმალური წინასწარი ჯავშნის საათები</Label>
              <input
                id="min-hours"
                type="number"
                min="0"
                max="168"
                value={settings.min_advance_hours}
                onChange={(e) =>
                  setSettings({ ...settings, min_advance_hours: parseInt(e.target.value) || 2 })
                }
                className="w-full px-3 py-2 border border-input rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-fee">ჯავშნის საკომისიო (%)</Label>
              <input
                id="booking-fee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.booking_fee_percentage}
                onChange={(e) =>
                  setSettings({ ...settings, booking_fee_percentage: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-input rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          შენახვა
        </Button>
      </div>
    </div>
  );
};

export default BookingManagement;