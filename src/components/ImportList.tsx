import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Upload, Save } from 'lucide-react';

interface ImportedProduct {
  internal_code: string;
  product_description: string;
  barcode: string;
}

export const ImportList: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listName, setListName] = useState('');
  const [importedData, setImportedData] = useState<ImportedProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['A', 'B', 'C'] });

        const products: ImportedProduct[] = jsonData
          .slice(1) // Skip header row
          .filter((row: any) => row.A && row.B) // Only rows with code and description
          .map((row: any) => ({
            internal_code: String(row.A || ''),
            product_description: String(row.B || ''),
            barcode: String(row.C || '')
          }));

        setImportedData(products);
        toast({
          title: "Arquivo importado",
          description: `${products.length} produtos encontrados`,
        });
      } catch (error) {
        toast({
          title: "Erro ao importar",
          description: "Verifique se o arquivo está no formato correto",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const saveList = async () => {
    if (!listName.trim() || importedData.length === 0) {
      toast({
        title: "Erro",
        description: "Digite um nome para a lista e importe produtos",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Create saved list
      const { data: savedList, error: listError } = await supabase
        .from('saved_lists')
        .insert({
          name: listName,
          created_by: user.id
        })
        .select()
        .single();

      if (listError) throw listError;

      // Insert list items
      const listItems = importedData.map(product => ({
        list_id: savedList.id,
        internal_code: product.internal_code,
        product_description: product.product_description,
        barcode: product.barcode
      }));

      const { error: itemsError } = await supabase
        .from('list_items')
        .insert(listItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Lista salva",
        description: `Lista "${listName}" salva com ${importedData.length} produtos`,
      });

      setIsOpen(false);
      setListName('');
      setImportedData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar Lista
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Lista de Produtos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Arquivo Excel (.xls, .xlsx)</Label>
            <Input
              id="file"
              type="file"
              ref={fileInputRef}
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Formato: Coluna A = Código Interno, Coluna B = Descrição, Coluna C = Código de Barras
            </p>
          </div>

          {importedData.length > 0 && (
            <>
              <div>
                <Label htmlFor="listName">Nome da Lista</Label>
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Digite o nome da lista"
                  className="mt-1"
                />
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md p-3">
                <h4 className="font-medium mb-2">Produtos Importados ({importedData.length})</h4>
                <div className="space-y-1 text-sm">
                  {importedData.slice(0, 10).map((product, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 py-1 border-b">
                      <span className="truncate">{product.internal_code}</span>
                      <span className="truncate">{product.product_description}</span>
                      <span className="truncate">{product.barcode}</span>
                    </div>
                  ))}
                  {importedData.length > 10 && (
                    <p className="text-muted-foreground">... e mais {importedData.length - 10} produtos</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={saveList} 
                disabled={isSaving || !listName.trim()}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Lista'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};