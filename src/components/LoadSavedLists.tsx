import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Trash2 } from 'lucide-react';

interface SavedList {
  id: string;
  name: string;
  created_at: string;
  item_count: number;
}

interface LoadSavedListsProps {
  onLoadList?: (listId: string) => void;
}

export const LoadSavedLists: React.FC<LoadSavedListsProps> = ({ onLoadList }) => {
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSavedLists = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_lists')
        .select(`
          id,
          name,
          created_at,
          list_items(count)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listsWithCount = data.map(list => ({
        id: list.id,
        name: list.name,
        created_at: list.created_at,
        item_count: list.list_items?.[0]?.count || 0
      }));

      setSavedLists(listsWithCount);
    } catch (error) {
      toast({
        title: "Erro ao carregar listas",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteList = async (listId: string, listName: string) => {
    try {
      const { error } = await supabase
        .from('saved_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      toast({
        title: "Lista excluída",
        description: `Lista "${listName}" foi excluída`,
      });

      fetchSavedLists();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const loadListItems = async (listId: string, listName: string) => {
    try {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId);

      if (error) throw error;

      // Here you would update the spreadsheet with the loaded items
      // For now, we'll just show a success message
      toast({
        title: "Lista carregada",
        description: `Lista "${listName}" carregada com ${data.length} itens`,
      });

      if (onLoadList) {
        onLoadList(listId);
      }

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSavedLists();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderOpen className="w-4 h-4 mr-2" />
          Carregar Lista
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Listas Salvas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando listas...</p>
          ) : savedLists.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma lista salva encontrada</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedLists.map((list) => (
                <div key={list.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{list.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {list.item_count} itens • {new Date(list.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => loadListItems(list.id, list.name)}
                    >
                      Carregar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteList(list.id, list.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};