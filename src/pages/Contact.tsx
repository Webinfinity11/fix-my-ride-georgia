import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <Layout>
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">დაგვიკავშირდით</CardTitle>
              <CardDescription>გამოგვიგზავნეთ შეტყობინება ან დაგვიკავშირდით ქვემოთ მოცემული ინფორმაციით</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name">სახელი</Label>
                    <Input type="text" id="name" placeholder="თქვენი სახელი" />
                  </div>
                  <div>
                    <Label htmlFor="email">ელ.ფოსტა</Label>
                    <Input type="email" id="email" placeholder="თქვენი ელ.ფოსტა" />
                  </div>
                  <div>
                    <Label htmlFor="message">შეტყობინება</Label>
                    <Textarea id="message" placeholder="თქვენი შეტყობინება" rows={4} />
                  </div>
                  <Button className="w-full">გაგზავნა</Button>
                </form>
              </div>
              <div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>info@fixup.ge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>+995 599 12 34 56</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>თბილისი, საქართველო</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-center">
              <p className="text-sm text-gray-500">© 2024 FixUp. ყველა უფლება დაცულია.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
