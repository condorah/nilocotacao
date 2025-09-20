import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link2, Eye, X } from 'lucide-react';

interface QuotationManagementProps {
  loadedListId: string | null;
  listItems: any[];
  quotationResponses: any[];
  onQuotationUpdate: () => void;
}

export const QuotationManagement: React.FC<QuotationManagementProps> = ({ 
  loadedListId, 
  listItems, 
  quotationResponses,
  onQuotationUpdate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [quotationRequest, setQuotationRequest] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const generateQuotationLink = async () => {
    if (!loadedListId || !supplierName.trim()) {
      toast({
        title: "Erro",
        description: "Carregue uma lista e digite o nome do fornecedor",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create quotation list from loaded list
      const { data: quotationList, error: quotationListError } = await supabase
        .from('quotation_lists')
        .insert({
          name: `Cotação - ${supplierName}`,
          created_by: user.id
        })
        .select()
        .single();

      if (quotationListError) throw quotationListError;

      // Create quotation list items
      const quotationItems = listItems.map(item => ({
        quotation_list_id: quotationList.id,
        product_id: item.id || crypto.randomUUID() // Use item id or generate one
      }));

      const { error: itemsError } = await supabase
        .from('quotation_list_items')
        .insert(quotationItems);

      if (itemsError) throw itemsError;

      // Create quotation request
      const { data: request, error: requestError } = await supabase
        .from('quotation_requests')
        .insert({
          title: `Cotação para ${supplierName}`,
          quotation_list_id: quotationList.id,
          requested_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const quotationUrl = `${window.location.origin}/cotacao/${request.id}?supplier=${encodeURIComponent(supplierName)}`;
      
      await navigator.clipboard.writeText(quotationUrl);
      
      toast({
        title: "Link gerado",
        description: `Link copiado para ${supplierName}`,
      });

      setQuotationRequest(request);
      setIsOpen(false);
      setSupplierName('');
      onQuotationUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const closeQuotation = async () => {
    if (!quotationRequest) return;

    try {
      const { error } = await supabase
        .from('quotation_requests')
        .update({ status: 'closed' })
        .eq('id', quotationRequest.id);

      if (error) throw error;

      toast({
        title: "Cotação fechada",
        description: "Cotação movida para finalizadas",
      });

      onQuotationUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao fechar cotação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!loadedListId}>
            <Link2 className="w-4 h-4 mr-2" />
            Gerar Link Cotação
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Link de Cotação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">Nome do Fornecedor</Label>
              <Input
                id="supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Digite o nome da empresa fornecedora"
              />
            </div>
            <Button 
              onClick={generateQuotationLink} 
              disabled={isCreating || !supplierName.trim()}
              className="w-full"
            >
              {isCreating ? 'Gerando...' : 'Gerar Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {quotationResponses.length > 0 && (
        <Button variant="outline" size="sm" onClick={closeQuotation}>
          <X className="w-4 h-4 mr-2" />
          Fechar Cotação
        </Button>
      )}
    </div>
  );
};