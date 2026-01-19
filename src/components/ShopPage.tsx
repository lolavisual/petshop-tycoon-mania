import PetShopPage from './PetShopPage';

interface ShopPageProps {
  setCurrentPage?: (page: string) => void;
}

// Компонент магазина теперь показывает реальные зоотовары
const ShopPage = ({ setCurrentPage }: ShopPageProps) => {
  return <PetShopPage setCurrentPage={setCurrentPage} />;
};

export default ShopPage;
