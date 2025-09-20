import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Auth } from '@/components/Auth';
import { Spreadsheet } from '@/components/Spreadsheet';
import { ImportList } from '@/components/ImportList';
import { LoadSavedLists } from '@/components/LoadSavedLists';
import { QuotationManagement } from '@/components/QuotationManagement';
import { FinishedQuotations } from '@/components/FinishedQuotations';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loadedListId, setLoadedListId] = useState<string | null>(null);
  const [listItems, setListItems] = useState<any[]>([]);
  const [quotationResponses, setQuotationResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoadList = async (listId: string) => {
    setLoadedListId(listId);
    // Load list items and any existing quotation responses
    try {
      const { data: items } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId);
      
      setListItems(items || []);
      
      // Load existing quotation responses
      const { data: responses } = await supabase
        .from('quotation_responses')
        .select(`
          *,
          quotation_requests!inner(quotation_lists!inner(name))
        `)
        .eq('quotation_requests.quotation_lists.name', `Cotação - Lista ${listId}`);
      
      setQuotationResponses(responses || []);
    } catch (error) {
      console.error('Error loading list data:', error);
    }
  };

  const handleQuotationUpdate = async () => {
    if (loadedListId) {
      handleLoadList(loadedListId);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  return (
    <div className="w-full h-screen bg-background">
      <header className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Nilo Atacadista</h1>
        <div className="flex items-center gap-4">
          <ImportList />
          <LoadSavedLists onLoadList={handleLoadList} />
          <QuotationManagement 
            loadedListId={loadedListId}
            listItems={listItems}
            quotationResponses={quotationResponses}
            onQuotationUpdate={handleQuotationUpdate}
          />
          <FinishedQuotations />
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>
      <div className="h-[calc(100vh-3rem)]">
        <Spreadsheet 
          listItems={listItems}
          quotationResponses={quotationResponses}
        />
      </div>
    </div>
  );
};

export default Index;
