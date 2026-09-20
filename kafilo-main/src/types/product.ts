export interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  isAvailable: boolean;
  category?: { 
    name: string;
    isDrink?: boolean; // <--- Tambahkan ini
  };
}