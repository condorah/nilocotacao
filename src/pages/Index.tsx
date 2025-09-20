import { Spreadsheet } from '@/components/Spreadsheet';
import { ImportList } from '@/components/ImportList';
import { LoadSavedLists } from '@/components/LoadSavedLists';

const Index = () => {
  return (
    <div className="w-full h-screen bg-background">
      <header className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Nilo Atacadista</h1>
        <div className="flex items-center gap-4">
          <ImportList />
          <LoadSavedLists />
        </div>
      </header>
      <div className="h-[calc(100vh-3rem)]">
        <Spreadsheet />
      </div>
    </div>
  );
};

export default Index;
