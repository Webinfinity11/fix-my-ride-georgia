
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">ხელოსნების ძიება</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <div className="flex gap-2">
                <Input 
                  placeholder="ჩაწერეთ სპეციალობა ან მომსახურება..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow"
                />
                <Button>
                  <SearchIcon className="h-4 w-4 mr-2" />
                  ძიება
                </Button>
              </div>
            </div>
            
            <div className="text-center py-12">
              <p className="text-muted-foreground">მოძებნეთ საუკეთესო ავტოხელოსანი თქვენი მანქანისთვის</p>
              {/* აქ შეგიძლიათ დაამატოთ მექანიკოსების სია */}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Search;
