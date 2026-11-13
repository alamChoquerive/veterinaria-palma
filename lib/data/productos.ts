export interface ProductoMock {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  precioCosto: number;
  precioMinorista: number;
  precioMayorista: number;
  imagen: string;
  descripcion: string;
}

export const PRODUCTOS: ProductoMock[] = [
  {
    id: "1",
    sku: "RC-AD-15",
    nombre: "Royal Canin Adulto 15 kg",
    categoria: "Alimentos perro",
    stock: 12,
    stockMinimo: 3,
    precioCosto: 8500,
    precioMinorista: 12500,
    precioMayorista: 10500,
    imagen: "https://images.unsplash.com/photo-1585110396000-9ff14c848b3d?w=400&h=400&fit=crop",
    descripcion: "Alimento balanceado para perros adultos de todas las razas.",
  },
  {
    id: "2",
    sku: "WK-PC-15",
    nombre: "Whiskas Pollo Adulto 1.5 kg",
    categoria: "Alimentos gato",
    stock: 20,
    stockMinimo: 5,
    precioCosto: 3200,
    precioMinorista: 4800,
    precioMayorista: 4100,
    imagen: "https://images.unsplash.com/photo-1575102410793-76997c0e04c6?w=400&h=400&fit=crop",
    descripcion: "Alimento para gatos adultos sabor pollo.",
  },
  {
    id: "3",
    sku: "CR-RT-5M",
    nombre: "Correa Retráctil 5 m",
    categoria: "Accesorios perro",
    stock: 8,
    stockMinimo: 2,
    precioCosto: 4500,
    precioMinorista: 7200,
    precioMayorista: 6100,
    imagen: "https://images.unsplash.com/photo-1552003832-883785207d50?w=400&h=400&fit=crop",
    descripcion: "Correa retráctil de 5 metros para perros medianos y grandes.",
  },
  {
    id: "4",
    sku: "AC-CF-01",
    nombre: "Arenero Cubierto con Filtro",
    categoria: "Accesorios gato",
    stock: 6,
    stockMinimo: 2,
    precioCosto: 6800,
    precioMinorista: 10900,
    precioMayorista: 9200,
    imagen: "https://images.unsplash.com/photo-1581091018700-423b3da9d72d?w=400&h=400&fit=crop",
    descripcion: "Arenero cerrado para gatos con filtro de carbón activado.",
  },
  {
    id: "5",
    sku: "JU-KC-M",
    nombre: "Juguete Kong Clásico M",
    categoria: "Juguetes",
    stock: 15,
    stockMinimo: 4,
    precioCosto: 2900,
    precioMinorista: 4900,
    precioMayorista: 4200,
    imagen: "https://images.unsplash.com/photo-1591753817279-3077d6089192?w=400&h=400&fit=crop",
    descripcion: "Juguete resistente para perros, tamaño mediano.",
  },
  {
    id: "6",
    sku: "SH-NP-500",
    nombre: "Shampoo Neutro para Perros 500 ml",
    categoria: "Higiene",
    stock: 18,
    stockMinimo: 5,
    precioCosto: 2100,
    precioMinorista: 3500,
    precioMayorista: 2900,
    imagen: "https://images.unsplash.com/photo-1603771189661-a0a8c9e5ac5d?w=400&h=400&fit=crop",
    descripcion: "Shampoo neutro para baño frecuente de perros.",
  },
  {
    id: "7",
    sku: "PP-CH-3",
    nombre: "Pro Plan Cachorro 3 kg",
    categoria: "Alimentos perro",
    stock: 9,
    stockMinimo: 3,
    precioCosto: 5600,
    precioMinorista: 8800,
    precioMayorista: 7600,
    imagen: "https://images.unsplash.com/photo-1574523423631-72124c7523c0?w=400&h=400&fit=crop",
    descripcion: "Alimento para cachorros de todas las razas.",
  },
  {
    id: "8",
    sku: "CD-AI-01",
    nombre: "Comedero Doble de Acero Inoxidable",
    categoria: "Accesorios perro",
    stock: 14,
    stockMinimo: 4,
    precioCosto: 3100,
    precioMinorista: 5200,
    precioMayorista: 4500,
    imagen: "https://images.unsplash.com/photo-1515717001300-8ef9c9a9a6ef?w=400&h=400&fit=crop",
    descripcion: "Comedero doble elevado de acero inoxidable para perros y gatos.",
  },
];
