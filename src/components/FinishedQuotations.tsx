import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Archive } from 'lucide-react';

interface FinishedQuotation {
  id: string;
  title: string;
  created_at: string;
  responses_count: number;
}

export const FinishedQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState<FinishedQuotation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFinishedQuotations = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quotation_requests')
        .select(`
          id,
          title,
          created_at,
          quotation_responses(count)
        `)
        .eq('requested_by', user.id)
        .eq('status', 'closed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const quotationsWithCount = data.map(quotation => ({
        id: quotation.id,
        title: quotation.title,
        created_at: quotation.created_at,
        responses_count: quotation.quotation_responses?.[0]?.count || 0
      }));

      setQuotations(quotationsWithCount);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cotações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFinishedQuotations();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Archive className="w-4 h-4 mr-2" />
          Cotações Finalizadas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cotações Finalizadas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando cotações...</p>
          ) : quotations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma cotação finalizada</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quotations.map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{quotation.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {quotation.responses_count} respostas • {new Date(quotation.created_at).toLocaleDateString('pt-BR')}
                    </p>
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