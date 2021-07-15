import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
       return JSON.parse(storagedCart);
     }
    return [];
  });

 // useEffect(() => {
 //   localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]))
 // }, [cart])


  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);
      const productIndex = cart.findIndex(product => product.id === productId);
      const hasStock = await api.get(`/stock/${productId}`).then(response => response.data.amount);
      const produto = await api.get(`/products/${productId}`).then(response => response.data);
      if(productExists)
      {
        if(hasStock > productExists.amount){
          productExists.amount += 1;
          cart[productIndex] = productExists
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
          return;
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }else{ 
        produto.amount = 1;
        setCart([...cart, produto])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, produto]))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);
      const filteredProducts = cart.filter(product => product.id !== productId);
      if(productExists){
        setCart(filteredProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProducts))
      }else{
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productExists = cart.find(product => product.id === productId);
      const productIndex = cart.findIndex(product => product.id === productId);
      const hasStock = await api.get(`/stock/${productId}`).then(response => response.data.amount);
      if(productExists){
        if(amount < 1){
          return;
        }else if(hasStock >= amount ){
          productExists.amount = amount
          cart[productIndex] = productExists
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
