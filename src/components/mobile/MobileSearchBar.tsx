import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Search, X, Clock, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

interface MobileSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  showVoiceSearch?: boolean;
}

export function MobileSearchBar({
  placeholder = 'მოძებნეთ სერვისი...',
  onSearch,
  showVoiceSearch = true,
}: MobileSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ka-GE';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to history
    const newHistory = [
      { query: searchQuery, timestamp: Date.now() },
      ...searchHistory.filter(item => item.query !== searchQuery),
    ].slice(0, 10); // Keep only last 10 searches

    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));

    // Perform search
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }

    setIsOpen(false);
    setQuery('');
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history');
  };

  const removeHistoryItem = (timestamp: number) => {
    const newHistory = searchHistory.filter(item => item.timestamp !== timestamp);
    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        aria-label="ძიების გახსნა"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{placeholder}</span>
      </button>

      {/* Search Bottom Sheet */}
      <BottomSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title="ძიება"
        description="მოძებნეთ სასურველი სერვისი"
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder={placeholder}
                className="pl-10"
                autoFocus
                aria-label="საძიებო ტექსტი"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="გასუფთავება"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showVoiceSearch && recognitionRef.current && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceSearch}
                className={cn(isListening && "bg-destructive text-destructive-foreground")}
                aria-label={isListening ? "ჩაწერის გაჩერება" : "ხმოვანი ძიება"}
              >
                {isListening ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}

            <Button
              onClick={() => handleSearch(query)}
              disabled={!query.trim()}
              aria-label="ძიება"
            >
              ძიება
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  ბოლო ძიებები
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs h-auto py-1"
                >
                  გასუფთავება
                </Button>
              </div>

              <div className="space-y-1">
                {searchHistory.map((item) => (
                  <div
                    key={item.timestamp}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted group"
                  >
                    <button
                      onClick={() => handleHistoryClick(item.query)}
                      className="flex-1 text-left text-sm"
                    >
                      {item.query}
                    </button>
                    <button
                      onClick={() => removeHistoryItem(item.timestamp)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded"
                      aria-label="წაშლა"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">პოპულარული ძიებები</h3>
            <div className="flex flex-wrap gap-2">
              {['ზეთის შეცვლა', 'საბურავები', 'დიაგნოსტიკა', 'ელექტრო', 'კონდიცირება'].map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
