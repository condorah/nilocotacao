import { Spreadsheet } from '@/components/Spreadsheet';

const Index = () => {
  return (
    <div className="w-full h-screen bg-background">
      <header className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Planilha Excel</h1>
        <div className="text-sm text-muted-foreground">
          Use as setas para navegar • Enter para editar • Escape para cancelar
        </div>
      </header>
      <div className="h-[calc(100vh-3rem)]">
        <Spreadsheet />
      </div>
    </div>
  );
};

export default Index;
