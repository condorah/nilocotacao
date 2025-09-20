import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

interface Product {
  id: string;
  internal_code: string;
  product_description: string;
  barcode: string;
}

interface QuotationResponse {
  product_id: string;
  price: number;
  min_quantity: number;
  delivery_days: number;
  observations: string;
}

export const QuotationResponse: React.FC = () => {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const supplierName = searchParams.get('supplier') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: QuotationResponse }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotationData();
  }, [requestId]);

  const fetchQuotationData = async () => {
    try {
      // Get quotation request details
      const { data: request, error: requestError } = await supabase
        .from('quotation_requests')
        .select(`
          *,
          quotation_lists (
            *,
            quotation_list_items (
              *
            )
          )
        `)
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // For now, we'll simulate products since the quotation system needs to be connected to products table
      const mockProducts = Array.from({ length: 5 }, (_, i) => ({
        id: `product-${i + 1}`,
        internal_code: `PROD${i + 1}`,
        product_description: `Produto ${i + 1} - Descrição do produto`,
        barcode: `123456789${i + 1}`
      }));

      setProducts(mockProducts);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cotação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateResponse = (productId: string, field: keyof QuotationResponse, value: any) => {
    setResponses(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        product_id: productId,
        [field]: value
      }
    }));
  };

  const submitQuotation = async () => {
    const responsesList = Object.values(responses).filter(r => r.price > 0);
    
    if (responsesList.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um preço",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create supplier record
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          company_name: supplierName,
          email: `${supplierName.toLowerCase().replace(/\s+/g, '')}@email.com`,
          password_hash: 'temp_hash'
        })
        .select()
        .single();

      if (supplierError && !supplierError.message.includes('duplicate key')) {
        throw supplierError;
      }

      // Insert quotation responses
      const quotationResponses = responsesList.map(response => ({
        ...response,
        quotation_request_id: requestId,
        supplier_id: supplier?.id || crypto.randomUUID(),
        submitted_at: new Date().toISOString()
      }));

      const { error: responsesError } = await supabase
        .from('quotation_responses')
        .insert(quotationResponses);

      if (responsesError) throw responsesError;

      toast({
        title: "Cotação enviada",
        description: "Sua resposta foi enviada com sucesso",
      });

      // Reset form
      setResponses({});
    } catch (error: any) {
      toast({
        title: "Erro ao enviar cotação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando cotação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cotação - {supplierName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-medium">{product.product_description}</h3>
                      <p className="text-sm text-muted-foreground">
                        Código: {product.internal_code} | Barras: {product.barcode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Preço (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={responses[product.id]?.price || ''}
                        onChange={(e) => updateResponse(product.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Qtd Mínima</label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={responses[product.id]?.min_quantity || ''}
                        onChange={(e) => updateResponse(product.id, 'min_quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Prazo (dias)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={responses[product.id]?.delivery_days || ''}
                        onChange={(e) => updateResponse(product.id, 'delivery_days', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <Input
                        placeholder="Opcional"
                        value={responses[product.id]?.observations || ''}
                        onChange={(e) => updateResponse(product.id, 'observations', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                onClick={submitQuotation} 
                disabled={isSubmitting} 
                className="w-full mt-6"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};