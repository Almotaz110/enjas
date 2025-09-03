import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface QuoteWithSource {
  text: string;
  source: string;
}

const QUOTE_STORAGE_KEY = 'motivational_quote_data';
const HOUR_IN_MS = 60 * 60 * 1000; // 1 hour in milliseconds

interface StoredQuoteData {
  quote: QuoteWithSource;
  lastUpdated: number;
}

export const useMotivationalQuotes = () => {
  const { t } = useLanguage();
  const [currentQuote, setCurrentQuote] = useState<QuoteWithSource>({ text: '', source: '' });

  const getRandomQuote = (): QuoteWithSource => {
    const quotes = t('motivationalQuotes');
    
    if (Array.isArray(quotes) && quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const selectedQuote = quotes[randomIndex];
      
      // Handle both old string format and new object format
      if (typeof selectedQuote === 'string') {
        return { text: selectedQuote, source: '' };
      }
      return selectedQuote as QuoteWithSource;
    }
    
    return { text: '', source: '' };
  };

  const shouldUpdateQuote = (): boolean => {
    try {
      const storedData = localStorage.getItem(QUOTE_STORAGE_KEY);
      if (!storedData) return true;

      const parsedData: StoredQuoteData = JSON.parse(storedData);
      const now = Date.now();
      
      return now - parsedData.lastUpdated >= HOUR_IN_MS;
    } catch {
      return true;
    }
  };

  const updateCurrentQuote = () => {
    const quote = getRandomQuote();
    
    const now = Date.now();
    
    const quoteData: StoredQuoteData = {
      quote,
      lastUpdated: now
    };
    
    setCurrentQuote(quote);
    localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quoteData));
  };

  const loadStoredQuote = () => {
    try {
      const storedData = localStorage.getItem(QUOTE_STORAGE_KEY);
      if (storedData) {
        const parsedData: StoredQuoteData = JSON.parse(storedData);
        return parsedData.quote;
      }
    } catch {
      return null;
    }
    return null;
  };

  useEffect(() => {
    // Add delay to ensure language context is ready
    const timer = setTimeout(() => {
      if (shouldUpdateQuote()) {
        updateCurrentQuote();
      } else {
        const storedQuote = loadStoredQuote();
        if (storedQuote && storedQuote.text) {
          setCurrentQuote(storedQuote);
        } else {
          updateCurrentQuote();
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [t]);

  useEffect(() => {
    // Set up interval to check every minute if an hour has passed
    const interval = setInterval(() => {
      if (shouldUpdateQuote()) {
        updateCurrentQuote();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [t]);

  return {
    currentQuote,
    updateCurrentQuote
  };
};