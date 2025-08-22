import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SitemapUpdater } from '@/components/admin/SitemapUpdater';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Edit, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SEOMetadata {
  id: string;
  page_type: string;
  page_id: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  h1_title?: string;
  h2_description?: string;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Page {
  id: string;
  name: string;
}

const SEOManagement = () => {
  const [seoItems, setSeoItems] = useState<SEOMetadata[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pages] = useState<Page[]>([
    { id: 'home', name: 'მთავარი გვერდი' },
    { id: 'about', name: 'ჩვენს შესახებ' },
    { id: 'contact', name: 'კონტაქტი' },
    { id: 'services', name: 'სერვისები' },
    { id: 'mechanics', name: 'ხელოსნები' },
    { id: 'search', name: 'ძებნა' },
    { id: 'sitemap', name: 'საიტმაპი' }
  ]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SEOMetadata | null>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    page_type: '',
    page_id: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    h1_title: '',
    h2_description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [seoResponse, servicesResponse, categoriesResponse] = await Promise.all([
        supabase.from('seo_metadata').select('*').order('created_at', { ascending: false }),
        supabase.from('mechanic_services').select('id, name'),
        supabase.from('service_categories').select('id, name')
      ]);

      if (seoResponse.error) throw seoResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setSeoItems(seoResponse.data || []);
      setServices(servicesResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('მონაცემების ჩატვირთვის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('seo_metadata')
          .update(formData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('SEO მონაცემები განახლდა');
      } else {
        const { error } = await supabase
          .from('seo_metadata')
          .insert([formData]);
        
        if (error) throw error;
        toast.success('ახალი SEO მონაცემები დაემატა');
      }
      
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving SEO data:', error);
      toast.error('შენახვის შეცდომა');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('seo_metadata')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('SEO მონაცემები წაიშალა');
      fetchData();
    } catch (error) {
      console.error('Error deleting SEO data:', error);
      toast.error('წაშლის შეცდომა');
    }
  };

  const resetForm = () => {
    setFormData({
      page_type: '',
      page_id: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      h1_title: '',
      h2_description: ''
    });
    setEditingItem(null);
    setDialogOpen(false);
  };

  const openEditDialog = (item: SEOMetadata) => {
    setEditingItem(item);
    setFormData({
      page_type: item.page_type,
      page_id: item.page_id,
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || '',
      meta_keywords: item.meta_keywords || '',
      h1_title: item.h1_title || '',
      h2_description: item.h2_description || ''
    });
    setDialogOpen(true);
  };

  const openAddDialog = (pageType: string) => {
    setFormData({
      page_type: pageType,
      page_id: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      h1_title: '',
      h2_description: ''
    });
    setEditingItem(null);
    setDialogOpen(true);
  };

  const getItemName = (item: SEOMetadata) => {
    if (item.page_type === 'service') {
      const service = services.find(s => s.id.toString() === item.page_id);
      return service?.name || item.page_id;
    } else if (item.page_type === 'category') {
      const category = categories.find(c => c.id.toString() === item.page_id);
      return category?.name || item.page_id;
    } else if (item.page_type === 'page') {
      const page = pages.find(p => p.id === item.page_id);
      return page?.name || item.page_id;
    }
    return item.page_id;
  };

  const filteredItems = seoItems.filter(item => {
    let matchesTab = false;
    if (activeTab === 'services') {
      matchesTab = item.page_type === 'service';
    } else if (activeTab === 'categories') {
      matchesTab = item.page_type === 'category';
    } else if (activeTab === 'pages') {
      matchesTab = item.page_type === 'page';
    }
    
    const matchesSearch = getItemName(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.meta_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.h1_title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">იტვირთება...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SEO მართვა</h1>
      </div>

      {/* Sitemap Management */}
      <div className="grid grid-cols-1 gap-6">
        <SitemapUpdater />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">სერვისები</TabsTrigger>
          <TabsTrigger value="categories">კატეგორიები</TabsTrigger>
          <TabsTrigger value="pages">გვერდები</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="ძებნა..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button onClick={() => openAddDialog('service')}>
              <Plus className="h-4 w-4 mr-2" />
              ახალი SEO
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>სერვისების SEO მონაცემები</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    SEO მონაცემები ვერ მოიძებნა
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{getItemName(item)}</h3>
                          <Badge variant="secondary">{item.page_type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Meta Title:</strong> {item.meta_title || 'არ არის მითითებული'}</p>
                          <p><strong>H1:</strong> {item.h1_title || 'არ არის მითითებული'}</p>
                          <p><strong>Meta Description:</strong> {item.meta_description ? 
                            `${item.meta_description.substring(0, 60)}...` : 'არ არის მითითებული'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>დაშლის დადასტურება</AlertDialogTitle>
                              <AlertDialogDescription>
                                დარწმუნებული ხართ, რომ გსურთ ამ SEO მონაცემების წაშლა?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                წაშლა
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="ძებნა..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button onClick={() => openAddDialog('category')}>
              <Plus className="h-4 w-4 mr-2" />
              ახალი SEO
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>კატეგორიების SEO მონაცემები</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    SEO მონაცემები ვერ მოიძებნა
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{getItemName(item)}</h3>
                          <Badge variant="secondary">{item.page_type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Meta Title:</strong> {item.meta_title || 'არ არის მითითებული'}</p>
                          <p><strong>H1:</strong> {item.h1_title || 'არ არის მითითებული'}</p>
                          <p><strong>Meta Description:</strong> {item.meta_description ? 
                            `${item.meta_description.substring(0, 60)}...` : 'არ არის მითითებული'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>დაშლის დადასტურება</AlertDialogTitle>
                              <AlertDialogDescription>
                                დარწმუნებული ხართ, რომ გსურთ ამ SEO მონაცემების წაშლა?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                წაშლა
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="ძებნა..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button onClick={() => openAddDialog('page')}>
              <Plus className="h-4 w-4 mr-2" />
              ახალი SEO
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>გვერდების SEO მონაცემები</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 {filteredItems.length === 0 ? (
                   <p className="text-center text-muted-foreground py-8">
                     SEO მონაცემები ვერ მოიძებნა
                   </p>
                 ) : (
                   filteredItems.map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                       <div className="flex-1">
                         <div className="flex items-center space-x-2 mb-2">
                           <h3 className="font-medium">{getItemName(item)}</h3>
                           <Badge variant="secondary">{item.page_type}</Badge>
                         </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Meta Title:</strong> {item.meta_title || 'არ არის მითითებული'}</p>
                          <p><strong>H1:</strong> {item.h1_title || 'არ არის მითითებული'}</p>
                          <p><strong>Meta Description:</strong> {item.meta_description ? 
                            `${item.meta_description.substring(0, 60)}...` : 'არ არის მითითებული'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>დაშლის დადასტურება</AlertDialogTitle>
                              <AlertDialogDescription>
                                დარწმუნებული ხართ, რომ გსურთ ამ SEO მონაცემების წაშლა?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                წაშლა
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'SEO მონაცემების რედაქტირება' : 'ახალი SEO მონაცემები'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page_type">გვერდის ტიპი</Label>
                <Select 
                  value={formData.page_type} 
                  onValueChange={(value) => setFormData({ ...formData, page_type: value })}
                  disabled={!!editingItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიეთ ტიპი" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">სერვისი</SelectItem>
                    <SelectItem value="category">კატეგორია</SelectItem>
                    <SelectItem value="page">გვერდი</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="page_id">
                  {formData.page_type === 'service' ? 'სერვისი' : 
                   formData.page_type === 'category' ? 'კატეგორია' : 'გვერდის სახელი'}
                </Label>
                {formData.page_type === 'service' ? (
                  <Select 
                    value={formData.page_id} 
                    onValueChange={(value) => setFormData({ ...formData, page_id: value })}
                    disabled={!!editingItem}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="აირჩიეთ სერვისი" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : formData.page_type === 'category' ? (
                  <Select 
                    value={formData.page_id} 
                    onValueChange={(value) => setFormData({ ...formData, page_id: value })}
                    disabled={!!editingItem}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="აირჩიეთ კატეგორია" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select 
                    value={formData.page_id} 
                    onValueChange={(value) => setFormData({ ...formData, page_id: value })}
                    disabled={!!editingItem}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="აირჩიეთ გვერდი" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="h1_title">H1 სათაური</Label>
              <Input
                value={formData.h1_title}
                onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
                placeholder="H1 სათაური"
              />
            </div>

            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Meta Title"
              />
            </div>

            <div>
              <Label htmlFor="h2_description">H2 აღწერა</Label>
              <Textarea
                value={formData.h2_description}
                onChange={(e) => setFormData({ ...formData, h2_description: e.target.value })}
                placeholder="H2 აღწერა"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Meta Description (150-160 სიმბოლო)"
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                სიმბოლოები: {formData.meta_description.length}/160
              </p>
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                placeholder="საკვანძო სიტყვები, მძიმეთი გამოყოფილი"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                გაუქმება
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                შენახვა
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SEOManagement;